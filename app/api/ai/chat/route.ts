import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/auth/security";
import {
  executeDatasetQuery,
  buildGroundingPromptContext,
  AIQueryResponse,
} from "@/lib/services/ai-query-engine";
import {
  searchInfrastructureWeb,
  WebSearchResult,
} from "@/lib/services/web-search-service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    let { prompt, apiKey: clientApiKey, enableWebSearch } = body;

    // 1. Authenticate clearance (allow if valid session OR if user provided their own key)
    const cookieToken = req.cookies.get("atlasgrid_session")?.value;
    const authHeader = req.headers.get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
    const token = cookieToken || bearerToken;

    const auth = verifySessionToken(token);
    const hasOwnKey = typeof clientApiKey === "string" && clientApiKey.trim().length > 15;

    if (!auth.valid && !hasOwnKey) {
      return NextResponse.json(
        {
          error: "Unauthorized: Level-5 Clearance Required to query AtlasGrid Intelligence Copilot.",
        },
        { status: 401 }
      );
    }

    // 2. Validate prompt
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "A prompt query is required." },
        { status: 400 }
      );
    }

    const geminiKey = (clientApiKey || process.env.GEMINI_API_KEY || "")
      .trim()
      .replace(/['"]/g, "");

    // 3. Autonomous Web Search Grounding for live intelligence
    const q = prompt.toLowerCase();
    const shouldSearchWeb =
      enableWebSearch !== false ||
      q.includes("latest") ||
      q.includes("recent") ||
      q.includes("news") ||
      q.includes("deal") ||
      q.includes("expansion") ||
      q.includes("search") ||
      q.includes("internet") ||
      q.includes("web") ||
      q.includes("google") ||
      q.includes("microsoft") ||
      q.includes("adani") ||
      q.includes("reliance") ||
      q.includes("market") ||
      q.includes("invest") ||
      q.includes("future") ||
      q.includes("2026") ||
      q.includes("2027");

    let liveWebSources: WebSearchResult[] = [];
    if (shouldSearchWeb) {
      liveWebSources = await searchInfrastructureWeb(prompt);
    }

    const webContext = liveWebSources.length > 0
      ? `\n\nLIVE INTERNET GROUNDING (VERIFIED WEB SOURCES):\n` +
        liveWebSources
          .map(
            (s, idx) =>
              `[Source ${idx + 1}: ${s.source}] ${s.title}\nSummary: ${s.snippet}\nLink: ${s.url}`
          )
          .join("\n\n")
      : "";

    // 4. If Gemini key is available, call Gemini with grounded context
    if (geminiKey) {
      try {
        const groundingContext = buildGroundingPromptContext();
        const payload = {
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `${groundingContext}${webContext}\n\nUSER QUESTION: "${prompt}"\n\nPlease answer accurately using the verified facts and live web findings above. Mention exact numbers from the ontology (e.g. India in 2025 vs 2026) and cite key web findings where appropriate. Palantir Gotham format.`,
                },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: 1000,
          },
        };

        // Dynamic model discovery for the user's key
        let candidateModels: string[] = [];
        try {
          const modelsListUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey}`;
          const listRes = await fetch(modelsListUrl, { method: "GET" });
          if (listRes.ok) {
            const listData = await listRes.json().catch(() => ({}));
            if (Array.isArray(listData.models)) {
              const validModels = listData.models
                .filter((m: any) => {
                  const name = (m.name || "").replace(/^models\//, "");
                  const isGenerateContent =
                    Array.isArray(m.supportedGenerationMethods) &&
                    m.supportedGenerationMethods.includes("generateContent");
                  const isTextModel =
                    !name.includes("embedding") &&
                    !name.includes("aqa") &&
                    !name.includes("imagen") &&
                    !name.includes("bison");
                  return isGenerateContent && isTextModel;
                })
                .map((m: any) => (m.name || "").replace(/^models\//, ""));

              validModels.sort((a: string, b: string) => {
                const score = (modelName: string) => {
                  if (modelName === "gemini-3.6-flash") return 110;
                  if (modelName === "gemini-2.5-flash") return 105;
                  if (modelName === "gemini-2.0-flash") return 100;
                  if (modelName === "gemini-2.0-flash-lite") return 95;
                  if (modelName.includes("2.5-flash")) return 90;
                  if (modelName.includes("2.0-flash")) return 85;
                  if (modelName.includes("flash")) return 70;
                  if (modelName.includes("pro")) return 60;
                  return 10;
                };
                return score(b) - score(a);
              });

              if (validModels.length > 0) {
                candidateModels = validModels;
              }
            }
          }
        } catch {
          // fallback to static models list
        }

        if (candidateModels.length === 0) {
          candidateModels = [
            "gemini-2.5-flash",
            "gemini-3.6-flash",
            "gemini-2.0-flash",
            "gemini-2.0-flash-lite",
            "gemini-pro",
          ];
        }

        let candidateText: string | null = null;
        let lastError: string | null = null;

        for (const model of candidateModels) {
          const endpoints = [
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
            `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${geminiKey}`,
          ];

          let succeeded = false;
          for (const url of endpoints) {
            try {
              const geminiRes = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              });

              const geminiData = await geminiRes.json().catch(() => ({}));

              if (geminiRes.ok && geminiData?.candidates?.[0]?.content?.parts?.[0]?.text) {
                candidateText = geminiData.candidates[0].content.parts[0].text;
                succeeded = true;
                break;
              } else if (geminiData?.error?.message) {
                lastError = geminiData.error.message;
              }
            } catch (err: any) {
              lastError = err.message || lastError;
            }
          }

          if (succeeded) {
            break;
          }
        }

        if (candidateText) {
          const localDerived = executeDatasetQuery(prompt);

          return NextResponse.json({
            success: true,
            answer: candidateText,
            facts: localDerived.facts,
            actions: localDerived.actions,
            sources: liveWebSources.slice(0, 4),
            confidence: 0.98,
            source: "gemini-grounded",
          });
        } else if (lastError) {
          // Return clean grounded answer without ugly error banners, but pass error in metadata
          const sanitizedError = geminiKey ? lastError.replaceAll(geminiKey, "[REDACTED_API_KEY]") : lastError;
          const localDerived = executeDatasetQuery(prompt);
          return NextResponse.json({
            success: true,
            answer: localDerived.answer,
            facts: localDerived.facts,
            actions: localDerived.actions,
            sources: liveWebSources.slice(0, 3),
            confidence: 1.0,
            source: "grounded-dataset",
            geminiError: sanitizedError,
          });
        }
      } catch (geminiError: any) {
        console.warn("[Gemini API] Error, falling back to local grounded engine:", geminiError?.message || "Unknown");
      }
    }

    // 5. Offline / Grounded Dataset Engine execution with live web sources
    const response: AIQueryResponse = executeDatasetQuery(prompt);

    return NextResponse.json({
      success: true,
      ...response,
      sources: liveWebSources.slice(0, 3),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "AI Copilot subsystem error: " + err.message },
      { status: 500 }
    );
  }
}
