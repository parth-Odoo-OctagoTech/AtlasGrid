import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const snapshotDir = path.join(process.cwd(), "data", "historical-snapshots");
    const manifestPath = path.join(snapshotDir, "manifest.json");

    if (!fs.existsSync(manifestPath)) {
      return NextResponse.json({
        success: true,
        manifest: [],
        message: "No historical snapshots archived yet."
      });
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

    // If specific date requested: return that point-in-time snapshot
    if (date) {
      const targetFile = path.join(snapshotDir, `${date}.json`);
      if (fs.existsSync(targetFile)) {
        const snap = JSON.parse(fs.readFileSync(targetFile, "utf-8"));
        return NextResponse.json({
          success: true,
          snapshot: snap
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            error: `Snapshot for date ${date} not found. Available dates: ${manifest.map((m: any) => m.snapshotDate).join(", ")}`
          },
          { status: 404 }
        );
      }
    }

    // Default: return manifest of all snapshots
    return NextResponse.json({
      success: true,
      totalSnapshotsArchived: manifest.length,
      latestSnapshotDate: manifest[0]?.snapshotDate || null,
      retentionPolicy: "365 daily immutable snapshots (rolling 1-year archive)",
      manifest
    });
  } catch (error: any) {
    console.error("Historical snapshots API error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
