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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function isExtensionError(event) {
                  try {
                    var str = '';
                    if (event && event.filename) str += event.filename + ' ';
                    if (event && event.message) str += event.message + ' ';
                    if (event && event.error && event.error.stack) str += event.error.stack + ' ';
                    if (event && event.reason) {
                      str += (event.reason.stack || event.reason.message || event.reason) + ' ';
                    }
                    return (
                      str.indexOf('chrome-extension://') !== -1 ||
                      str.indexOf('moz-extension://') !== -1 ||
                      str.indexOf('safari-extension://') !== -1 ||
                      str.indexOf('eppiocemhmnlbhjplcgkofciiegomcon') !== -1 ||
                      str.indexOf('bis_') !== -1 ||
                      str.indexOf('M_ID') !== -1
                    );
                  } catch(e) {
                    return false;
                  }
                }

                window.addEventListener('error', function(event) {
                  if (isExtensionError(event)) {
                    event.stopImmediatePropagation();
                    event.preventDefault();
                    return true;
                  }
                }, true);

                window.addEventListener('unhandledrejection', function(event) {
                  if (isExtensionError(event)) {
                    event.stopImmediatePropagation();
                    event.preventDefault();
                    return true;
                  }
                }, true);
              })();
            `,
          }}
        />
      </head>
      <body className="h-screen w-screen bg-background antialiased overflow-hidden" suppressHydrationWarning>
        <QueryProvider>
          <RealtimeTelemetryProvider>{children}</RealtimeTelemetryProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
