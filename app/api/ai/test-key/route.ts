import { NextRequest, NextResponse } from "next/server";

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

    // Test with gemini-1.5-flash
    const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const testPayload = {
      contents: [{ parts: [{ text: "ping" }] }],
      generationConfig: { maxOutputTokens: 5 },
    };

    const res = await fetch(testUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testPayload),
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok && data?.candidates?.[0]?.content) {
      return NextResponse.json({
        valid: true,
        model: "gemini-1.5-flash",
        message: "Gemini API key is valid and connected.",
      });
    }

    // Try fallback to gemini-2.0-flash
    const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const res2 = await fetch(fallbackUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testPayload),
    });

    const data2 = await res2.json().catch(() => ({}));

    if (res2.ok && data2?.candidates?.[0]?.content) {
      return NextResponse.json({
        valid: true,
        model: "gemini-2.0-flash",
        message: "Gemini API key is valid and connected to Gemini 2.0 Flash.",
      });
    }

    const errMessage =
      data?.error?.message ||
      data2?.error?.message ||
      "Invalid Gemini API key or unauthorized response from Google.";

    return NextResponse.json({
      valid: false,
      error: errMessage,
    });
  } catch (err: any) {
    return NextResponse.json(
      { valid: false, error: "Connection error: " + err.message },
      { status: 500 }
    );
  }
}
