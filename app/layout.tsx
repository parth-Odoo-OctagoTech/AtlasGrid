import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { RealtimeTelemetryProvider } from "@/components/providers/RealtimeTelemetryProvider";

export const metadata: Metadata = {
  title: "AtlasGrid - Global Power Grid & Data Center Infrastructure Observability",
  description:
    "Production-grade, real-time power grid and AI data center observability platform visualizing 5,200+ global power stations, 4,380+ compute facilities, high-voltage transmission interconnectors, subsea telecommunications fiber, and nodal LMP price formation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="h-screen w-screen bg-background antialiased overflow-hidden" suppressHydrationWarning>
        <QueryProvider>
          <RealtimeTelemetryProvider>{children}</RealtimeTelemetryProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
