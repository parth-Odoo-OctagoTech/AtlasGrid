import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, getSecurityAuditLog, ADMIN_USERNAME } from "@/lib/auth/security";

export async function GET(req: NextRequest) {
  // Check cookie or Bearer token header
  const cookieToken = req.cookies.get("atlasgrid_session")?.value;
  const authHeader = req.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
  const token = cookieToken || bearerToken;

  const result = verifySessionToken(token);

  if (!result.valid) {
    return NextResponse.json(
      {
        authenticated: false,
        user: null,
      },
      { status: 401 }
    );
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      username: result.username || ADMIN_USERNAME,
      role: result.role || "admin",
      clearanceLevel: "LEVEL_5_TOP_SECRET",
    },
    auditLog: getSecurityAuditLog().slice(0, 5),
  });
}
