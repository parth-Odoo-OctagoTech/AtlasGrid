import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, getSecurityAuditLog, ADMIN_USERNAME } from "@/lib/auth/security";
import { verifyJWT } from "@/lib/auth/jwt";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // 1. Check for JWT auth cookie (email signup)
  const authCookie = req.cookies.get("auth")?.value;
  const authHeader = req.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
  const jwtToken = authCookie || bearerToken;

  if (jwtToken) {
    try {
      const payload = await verifyJWT(jwtToken);
      return NextResponse.json({
        authenticated: true,
        user: {
          id: payload.userId,
          email: payload.email,
          role: payload.role || "analyst",
          company: payload.company || null,
          clearanceLevel: payload.role === "admin" ? "LEVEL_5_TOP_SECRET" : "INSTITUTIONAL_ANALYST",
        },
        auditLog: getSecurityAuditLog().slice(0, 5),
      });
    } catch {
      // If JWT verification failed, fall through to check legacy admin session token
    }
  }

  // 2. Check for legacy admin session token
  const legacyCookie = req.cookies.get("atlasgrid_session")?.value;
  if (legacyCookie) {
    const result = verifySessionToken(legacyCookie);
    if (result.valid) {
      return NextResponse.json({
        authenticated: true,
        user: {
          username: result.username || ADMIN_USERNAME,
          email: `${result.username || ADMIN_USERNAME}@ainframework.com`,
          role: result.role || "admin",
          clearanceLevel: "LEVEL_5_TOP_SECRET",
        },
        auditLog: getSecurityAuditLog().slice(0, 5),
      });
    }
  }

  return NextResponse.json(
    {
      authenticated: false,
      user: null,
    },
    { status: 401 }
  );
}
