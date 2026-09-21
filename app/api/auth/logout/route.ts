import { NextRequest, NextResponse } from "next/server";
import { addSecurityAudit } from "@/lib/auth/security";

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";

  addSecurityAudit("LOGOUT", ip, "Operator logged out. Terminal locked.");

  const response = NextResponse.json({
    success: true,
    message: "Session terminated. Security perimeter engaged.",
  });

  // Clear cookie
  response.cookies.set({
    name: "atlasgrid_session",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
