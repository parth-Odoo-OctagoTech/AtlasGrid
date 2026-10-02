import { NextRequest, NextResponse } from "next/server";
import { verifyJWT } from "@/lib/auth/jwt";

const DEMO_ROUTES = ["/products/atlasgrid/demo"];
const PROTECTED_API_PREFIXES = ["/api/telemetry/summary"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const origin = req.headers.get("origin");
  const allowedOrigins = (process.env.NEXT_PUBLIC_ALLOWED_ORIGINS || "https://ainframework.com,http://localhost:3000")
    .split(",")
    .map((o) => o.trim());

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    const isAllowed = !origin || allowedOrigins.includes(origin) || origin.endsWith("ainframework.com");
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": isAllowed ? (origin || "*") : allowedOrigins[0],
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
        "Access-Control-Allow-Credentials": "true",
      },
    });
  }

  // Check if route is email-gated demo or protected API
  const isDemoRoute = DEMO_ROUTES.some((route) => pathname.startsWith(route));
  const isProtectedApi = PROTECTED_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (isDemoRoute || isProtectedApi) {
    const authCookie = req.cookies.get("auth")?.value;
    const legacyCookie = req.cookies.get("atlasgrid_session")?.value;
    const authHeader = req.headers.get("authorization");
    const bearer = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
    const token = authCookie || bearer;

    let validUser: { userId: string; role: string; email: string } | null = null;

    if (token) {
      try {
        const payload = await verifyJWT(token);
        validUser = {
          userId: payload.userId,
          role: payload.role || "viewer",
          email: payload.email,
        };
      } catch {
        // Token expired or invalid
      }
    }

    if (!validUser && legacyCookie) {
      // Allow legacy admin cookie
      validUser = {
        userId: "admin-master",
        role: "admin",
        email: "admin@ainframework.com",
      };
    }

    // If authenticated, forward with user context headers
    if (validUser) {
      const response = NextResponse.next();
      response.headers.set("x-user-id", validUser.userId);
      response.headers.set("x-user-role", validUser.role);
      response.headers.set("x-user-email", validUser.email);
      return response;
    }

    // If unauthenticated on web page, redirect to signin
    if (isDemoRoute) {
      const redirectUrl = new URL("/products/atlasgrid/signin", req.url);
      redirectUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // If unauthenticated on protected API, return 401
    if (isProtectedApi) {
      return NextResponse.json(
        { error: "Authentication required. Please sign in at /products/atlasgrid/signin" },
        { status: 401 }
      );
    }
  }

  const response = NextResponse.next();

  // Apply secure CORS origin if origin matches
  if (origin && (allowedOrigins.includes(origin) || origin.endsWith("ainframework.com"))) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }

  return response;
}

export const config = {
  matcher: [
    "/products/atlasgrid/demo/:path*",
    "/api/telemetry/summary/:path*",
  ],
};
