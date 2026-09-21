import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/auth/security";
import {
  executeDatasetQuery,
  buildGroundingPromptContext,
  AIQueryResponse,
} from "@/lib/services/ai-query-engine";

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate clearance
    const cookieToken = req.cookies.get("atlasgrid_session")?.value;
    const authHeader = req.headers.get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
    const token = cookieToken || bearerToken;

    const auth = verifySessionToken(token);
    if (!auth.valid) {
      return NextResponse.json(
        {
          error: "Unauthorized: Level-5 Clearance Required to query AtlasGrid Intelligence Copilot.",
        },
        { status: 401 }
      );
    }

    // 2. Parse request
    const body = await req.json().catch(() => ({}));
    const { prompt, apiKey: clientApiKey } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "A prompt query is required." },
        { status: 400 }
      );
    }

    const geminiKey = clientApiKey || process.env.GEMINI_API_KEY;

    // 3. If Gemini key is available, call Gemini with grounded context
    if (geminiKey) {
      try {
        const groundingContext = buildGroundingPromptContext();
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;

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

        const geminiRes = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const candidateText =
            geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

          if (candidateText) {
            // Also derive deterministic actions from local engine
            const localDerived = executeDatasetQuery(prompt);

            return NextResponse.json({
              success: true,
              answer: candidateText,
              facts: localDerived.facts,
              actions: localDerived.actions,
              confidence: 0.98,
              source: "gemini-grounded",
            });
          }
        }
      } catch (geminiError) {
        console.warn("[Gemini API] Fallback to local grounded engine:", geminiError);
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
