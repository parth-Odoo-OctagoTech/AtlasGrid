import { DataCenter, DataCenterSummary } from "../types/data-center";
import datacentersRaw from "@/data/datacenters.json";

const staticDataCenters: DataCenter[] = datacentersRaw as unknown as DataCenter[];

export function getAllDataCenters(): DataCenter[] {
  return staticDataCenters || [];
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
