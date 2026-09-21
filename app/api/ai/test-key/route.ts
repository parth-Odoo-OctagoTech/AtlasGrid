import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    let { apiKey } = body;

    if (!apiKey || typeof apiKey !== "string") {
      return NextResponse.json(
        { valid: false, error: "API key is required." },
        { status: 400 }
      );
    }

    apiKey = apiKey.trim().replace(/['"]/g, "");

    // 1. Dynamic Model Discovery: query Google API for models accessible to this key
    let candidateModels: string[] = [];
    try {
      const modelsListUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
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

          // Prioritize standard production models
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

    // 2. Fallback cascade if ListModels is unavailable
    if (candidateModels.length === 0) {
      candidateModels = [
        "gemini-2.5-flash",
        "gemini-3.6-flash",
        "gemini-2.0-flash",
        "gemini-2.0-flash-lite",
        "gemini-pro",
      ];
    }

    const testPayload = {
      contents: [{ role: "user", parts: [{ text: "ping" }] }],
      generationConfig: { maxOutputTokens: 5 },
    };

    let lastError = "Invalid Gemini API key or unauthorized response from Google.";

    for (const model of candidateModels) {
      // Try v1beta, then v1
      const endpoints = [
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`,
      ];

      for (const testUrl of endpoints) {
        try {
          const res = await fetch(testUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(testPayload),
          });

          const data = await res.json().catch(() => ({}));

          if (res.ok && data?.candidates?.[0]?.content) {
            return NextResponse.json({
              valid: true,
              model: model,
              message: `Gemini API key is verified and connected to ${model}.`,
            });
          }

          if (data?.error?.message) {
            lastError = data.error.message;
          }
        } catch (err: any) {
          lastError = err.message || lastError;
        }
      }
    }

    if (apiKey && lastError) {
      lastError = lastError.replaceAll(apiKey, "[REDACTED_API_KEY]");
    }

    return NextResponse.json({
      valid: false,
      error: lastError,
    });
  } catch (err: any) {
    return NextResponse.json(
      { valid: false, error: "Connection error: " + err.message },
      { status: 500 }
    );
  }
}
