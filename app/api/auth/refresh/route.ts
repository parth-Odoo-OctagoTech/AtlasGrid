import { NextRequest, NextResponse } from "next/server";
import { signJWT, verifyJWT } from "@/lib/auth/jwt";
import { db } from "@/lib/db/pool";
import { logger } from "@/lib/logging";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get("refresh")?.value;

    if (!refreshToken) {
      return NextResponse.json({ error: "Missing refresh token" }, { status: 401 });
    }

    let payload;
    try {
      payload = await verifyJWT(refreshToken);
    } catch {
      return NextResponse.json({ error: "Invalid or expired refresh token" }, { status: 401 });
    }

    // Lookup user to get fresh role
    let userQuery = await db.query("SELECT id, email, role, company FROM users WHERE id = $1 OR email = $2", [
      payload.userId,
      payload.email,
    ]);
    const user = userQuery.rows[0] || {
      id: payload.userId,
      email: payload.email,
      role: "analyst",
    };

    const newAccessToken = await signJWT(
      {
        userId: user.id,
        email: user.email,
        role: user.role || "analyst",
        company: user.company,
      },
      { expiresIn: "15m" }
    );

    const response = NextResponse.json({
      ok: true,
      token: newAccessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role || "analyst",
      },
    });

    response.cookies.set("auth", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60,
    });

    return response;
  } catch (err) {
    logger.error("Error in /api/auth/refresh:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
