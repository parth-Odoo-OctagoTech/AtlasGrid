import { NextRequest, NextResponse } from "next/server";
import { signJWT } from "@/lib/auth/jwt";
import { db } from "@/lib/db/pool";
import { checkIpRateLimit } from "@/lib/middleware/rateLimiter";
import { logger } from "@/lib/logging";

export const dynamic = "force-dynamic";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";

  // Rate limiting (10 signups / min per IP)
  const rateLimit = checkIpRateLimit(ip, 10, 60000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many sign-up attempts. Please wait a moment." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { email, company, useCase } = body;

    // 1. Validate email
    if (!email || typeof email !== "string" || !isValidEmail(email)) {
      return NextResponse.json(
        { error: "A valid corporate or professional email address is required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCompany = typeof company === "string" ? company.trim().slice(0, 100) : "";
    const cleanUseCase = typeof useCase === "string" ? useCase.trim().slice(0, 100) : "DC Planning";

    // 2. Query / Upsert user in database
    let userQuery = await db.query("SELECT id, email, role, company FROM users WHERE email = $1", [cleanEmail]);
    let user = userQuery.rows[0];

    if (!user) {
      const insertQuery = await db.query(
        "INSERT INTO users (email, company, use_case, created_at, role) VALUES ($1, $2, $3, NOW(), $4)",
        [cleanEmail, cleanCompany || null, cleanUseCase || null, "analyst"]
      );
      user = insertQuery.rows[0] || {
        id: `usr-${Date.now()}`,
        email: cleanEmail,
        company: cleanCompany,
        role: "analyst",
      };
    } else {
      await db.query("UPDATE users SET last_login = NOW() WHERE id = $1", [user.id]);
    }

    // 3. Issue 15-minute access JWT & 7-day refresh JWT
    const token = await signJWT(
      {
        userId: user.id,
        email: user.email,
        role: user.role || "analyst",
        company: user.company || cleanCompany,
        useCase: cleanUseCase,
      },
      { expiresIn: "15m" }
    );

    const refreshToken = await signJWT(
      {
        userId: user.id,
        email: user.email,
        type: "refresh",
      },
      { expiresIn: "7d" }
    );

    // 4. Return cookies and response
    const response = NextResponse.json({
      ok: true,
      message: "Authentication successful",
      user: {
        id: user.id,
        email: user.email,
        role: user.role || "analyst",
        company: user.company,
      },
      token,
    });

    // 15-min access token cookie
    response.cookies.set("auth", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60,
    });

    // 7-day refresh token cookie
    response.cookies.set("refresh", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err) {
    logger.error("Error in /api/auth/signup:", err);
    return NextResponse.json({ error: "Failed to process authentication" }, { status: 500 });
  }
}
