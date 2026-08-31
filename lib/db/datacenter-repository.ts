import * as fs from "fs";
import * as path from "path";
import { DataCenter, DataCenterSummary } from "../types/data-center";

export function getAllDataCenters(): DataCenter[] {
  const filePath = path.join(process.cwd(), "data", "datacenters.json");
  if (!fs.existsSync(filePath)) {
    console.warn("datacenters.json not found, returning empty array");
    return [];
  }

  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) || [];
  } catch (err) {
    console.error("Error reading datacenters.json:", err);
    return [];
  }
}

export function getDataCenterById(id: string): DataCenter | null {
  const list = getAllDataCenters();
  return list.find((dc) => dc.id === id || dc.osmId?.toString() === id) || null;
}

export function getDataCenterSummary(): DataCenterSummary {
  const list = getAllDataCenters();
  let totalMw = 0;
  let totalPue = 0;
  let hyperscaleCount = 0;
  let colocationCount = 0;
  const opMap: Record<string, { count: number; totalMw: number }> = {};

  for (const dc of list) {
    totalMw += dc.estimatedPowerMw;
    totalPue += dc.pue;
    if (dc.category === "hyperscale") hyperscaleCount++;
    if (dc.category === "colocation") colocationCount++;

    if (!opMap[dc.operator]) {
      opMap[dc.operator] = { count: 0, totalMw: 0 };
    }
    opMap[dc.operator].count++;
    opMap[dc.operator].totalMw += dc.estimatedPowerMw;
  }

  const topOperators = Object.entries(opMap)
    .map(([operator, stat]) => ({ operator, count: stat.count, totalMw: stat.totalMw }))
    .sort((a, b) => b.totalMw - a.totalMw)
    .slice(0, 10);

  return {
    totalCount: list.length,
    totalEstimatedPowerMw: totalMw,
    hyperscaleCount,
    colocationCount,
    averagePue: list.length ? parseFloat((totalPue / list.length).toFixed(2)) : 1.25,
    topOperators,
  };
}
