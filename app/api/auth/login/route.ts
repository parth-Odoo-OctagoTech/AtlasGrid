import { NextRequest, NextResponse } from "next/server";
import { verifyAdminCredentials } from "@/lib/auth/security";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { username, password } = body;

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Operator ID and Passkey are required." },
        { status: 400 }
      );
    }

    const result = verifyAdminCredentials(username, password, ip);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          locked: result.locked,
          retryAfterSeconds: result.retryAfterSeconds,
        },
        { status: result.locked ? 429 : 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      user: result.user,
      token: result.token,
      message: "Security Clearance Granted: Level-5 Administrator",
    });

    // Set secure HTTP-only cookie
    response.cookies.set({
      name: "atlasgrid_session",
      value: result.token || "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Authentication subsystem error: " + err.message },
      { status: 500 }
    );
  }
}
