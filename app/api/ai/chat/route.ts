import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/auth/security";
import {
  executeDatasetQuery,
  buildGroundingPromptContext,
  AIQueryResponse,
} from "@/lib/services/ai-query-engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    let { prompt, apiKey: clientApiKey } = body;

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

    // 3. If Gemini key is available, call Gemini with grounded context
    if (geminiKey) {
      try {
        const groundingContext = buildGroundingPromptContext();
        const payload = {
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `${groundingContext}\n\nUSER QUESTION: "${prompt}"\n\nPlease answer accurately using the verified facts above. Include exact figures for any requested regions/years (e.g. India in 2025 vs current total). Palantir Gotham format.`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1, // low temperature to ensure strict adherence to ground facts
            maxOutputTokens: 800,
          },
        };

        // Try primary model (gemini-1.5-flash), then fallback (gemini-2.0-flash)
        const models = ["gemini-1.5-flash", "gemini-2.0-flash"];
        let candidateText: string | null = null;
        let lastError: string | null = null;

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
            break;
          } else {
            lastError =
              geminiData?.error?.message ||
              `HTTP ${geminiRes.status}: Unable to complete Gemini inference`;
          }
        }

        if (candidateText) {
          // Derive deterministic map actions & facts from local engine
          const localDerived = executeDatasetQuery(prompt);

          return NextResponse.json({
            success: true,
            answer: candidateText,
            facts: localDerived.facts,
            actions: localDerived.actions,
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
            confidence: 1.0,
            source: "grounded-dataset",
            geminiError: lastError,
          });
        }
      } catch (geminiError: any) {
        console.warn("[Gemini API] Error, falling back to local grounded engine:", geminiError);
      }
    }

    // 4. Offline / Grounded Dataset Engine execution
    const response: AIQueryResponse = executeDatasetQuery(prompt);

    return NextResponse.json({
      success: true,
      ...response,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "AI Copilot subsystem error: " + err.message },
      { status: 500 }
    );
  }
}
