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
          tools: [
            {
              google_search: {},
            },
          ],
          generationConfig: {
            temperature: 0.15,
            maxOutputTokens: 900,
          },
        };

        // Try primary model (gemini-1.5-flash), then fallback (gemini-2.0-flash)
        const models = ["gemini-1.5-flash", "gemini-2.0-flash"];
        let candidateText: string | null = null;
        let lastError: string | null = null;
        let geminiGroundingSources: WebSearchResult[] = [];

        for (const model of models) {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
          const geminiRes = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          const geminiData = await geminiRes.json().catch(() => ({}));

          if (geminiRes.ok && geminiData?.candidates?.[0]?.content?.parts?.[0]?.text) {
            candidateText = geminiData.candidates[0].content.parts[0].text;

            // Extract Google native search grounding metadata if present
            const metadata = geminiData.candidates[0]?.groundingMetadata;
            if (metadata?.groundingChunks) {
              for (const chunk of metadata.groundingChunks) {
                if (chunk.web?.uri && chunk.web?.title) {
                  geminiGroundingSources.push({
                    title: chunk.web.title,
                    url: chunk.web.uri,
                    source: "Google Search",
                    snippet: chunk.web.title,
                  });
                }
              }
            }
            break;
          } else {
            lastError =
              geminiData?.error?.message ||
              `HTTP ${geminiRes.status}: Unable to complete Gemini inference`;
          }
        }

        const combinedSources = [
          ...geminiGroundingSources,
          ...liveWebSources,
        ].filter(
          (s, idx, self) =>
            idx === self.findIndex((other) => other.url === s.url)
        ).slice(0, 4);

        if (candidateText) {
          // Derive deterministic map actions & facts from local engine
          const localDerived = executeDatasetQuery(prompt);

          return NextResponse.json({
            success: true,
            answer: candidateText,
            facts: localDerived.facts,
            actions: localDerived.actions,
            sources: combinedSources,
            confidence: 0.98,
            source: "gemini-grounded",
          });
        } else if (lastError) {
          // If Gemini API reported an explicit error, provide feedback alongside grounded data
          const localDerived = executeDatasetQuery(prompt);
          return NextResponse.json({
            success: true,
            answer: `> ⚠️ **Gemini API Notice**: Google returned: *"${lastError}"*.\n> Displaying verified AtlasGrid ground truth ontology below:\n\n${localDerived.answer}`,
            facts: localDerived.facts,
            actions: localDerived.actions,
            sources: liveWebSources.slice(0, 3),
            confidence: 1.0,
            source: "grounded-dataset",
            geminiError: lastError,
          });
        }
      } catch (geminiError: any) {
        console.warn("[Gemini API] Error, falling back to local grounded engine:", geminiError);
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
