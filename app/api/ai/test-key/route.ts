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

    // Priority model cascade starting with Gemini 3.6 Flash
    const candidateModels = [
      "gemini-3.6-flash",
      "gemini-3.7-flash",
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
    ];

    const testPayload = {
      contents: [{ role: "user", parts: [{ text: "ping" }] }],
      generationConfig: { maxOutputTokens: 5 },
    };

    let lastError = "Invalid Gemini API key or unauthorized response from Google.";

    for (const model of candidateModels) {
      try {
        const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
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
