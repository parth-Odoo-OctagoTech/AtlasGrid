import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyJWT } from "@/lib/auth/jwt";
import { verifySessionToken } from "@/lib/auth/security";
import { AtlasGridDemoClient } from "@/components/demo/AtlasGridDemoClient";

export const dynamic = "force-dynamic";

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth")?.value;

  if (token) {
    try {
      const payload = await verifyJWT(token);
      return {
        email: payload.email,
        role: payload.role || "analyst",
        company: payload.company,
      };
    } catch {
      // Expired or invalid token
    }
  }

  // Fallback to legacy admin session cookie if present
  const legacyToken = cookieStore.get("atlasgrid_session")?.value;
  if (legacyToken) {
    const legacy = verifySessionToken(legacyToken);
    if (legacy.valid) {
      return {
        email: "admin@ainframework.com",
        role: "admin",
        company: "AInframework",
      };
    }
  }

  return null;
}

export default async function AtlasGridDemoPage() {
  const user = await getAuthUser();

  if (!user) {
    redirect("/products/atlasgrid/signin?redirect=/products/atlasgrid/demo");
  }

  return (
    <Suspense
      fallback={
        <div className="h-screen w-screen flex items-center justify-center bg-[#070b14] text-cyan-400 font-mono text-sm">
          Loading AtlasGrid Telemetry Viewport...
        </div>
      }
    >
      <AtlasGridDemoClient initialUser={user} />
    </Suspense>
  );
}
