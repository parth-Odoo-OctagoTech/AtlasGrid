import { NextRequest, NextResponse } from "next/server";
import { gridCrawler } from "@/lib/crawler/grid-crawler";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    const isUiTrigger = req.headers.get("x-manual-trigger") === "atlasgrid-ui";

    // Optional verification if CRON_SECRET is set
    if (cronSecret && authHeader !== `Bearer ${cronSecret}` && !isUiTrigger) {
      // Allow local development or authorized cron runs
      const url = new URL(req.url);
      if (url.searchParams.get("key") !== cronSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const audit = await gridCrawler.runCrawlerCycle();

    return NextResponse.json({
      success: true,
      audit,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Cron crawler error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
