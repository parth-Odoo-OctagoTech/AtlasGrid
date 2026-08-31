"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from "recharts";
import { StationTimeSeriesPoint } from "@/lib/types/telemetry";

interface DispatchChartProps {
  data: StationTimeSeriesPoint[];
  fuelHex: string;
}

export function DispatchChart({ data, fuelHex }: DispatchChartProps) {
  const [metricView, setMetricView] = useState<"output" | "price" | "both">("both");

  if (!data || data.length === 0) {
    return (
      <div className="flex h-44 items-center justify-center rounded-lg border border-surface-border bg-slate-900/50 text-xs text-gray-500 font-mono">
        No 24-hour telemetry recorded
      </div>
    );
  }

  // Format data for chart
  const formattedData = data.map((d) => {
    const date = new Date(d.timestamp);
    return {
      time: `${String(date.getUTCHours()).padStart(2, "0")}:${String(
        date.getUTCMinutes()
      ).padStart(2, "0")}`,
      output: d.outputMw,
      capacity: d.capacityMw,
      price: d.spotPrice,
      co2: d.co2EmissionsTonsPerHour,
    };
  });

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/60 p-3.5 text-white shadow-sm">
      {/* Chart Header & Controls */}
      <div className="flex items-center justify-between pb-2.5 border-b border-white/10 text-xs">
        <span className="font-bold text-gray-200 tracking-wide text-xs uppercase">
          24-Hour Telemetry Curve
        </span>
        <div className="flex items-center rounded-lg border border-white/10 bg-slate-950/80 p-0.5 text-[10px]">
          <button
            onClick={() => setMetricView("output")}
            className={`rounded-md px-2 py-0.5 font-medium transition-all ${
              metricView === "output"
                ? "bg-slate-800 text-white font-semibold shadow-sm"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Output
          </button>
          <button
            onClick={() => setMetricView("price")}
            className={`rounded-md px-2 py-0.5 font-medium transition-all ${
              metricView === "price"
                ? "bg-slate-800 text-white font-semibold shadow-sm"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Price
          </button>
          <button
            onClick={() => setMetricView("both")}
            className={`rounded-md px-2 py-0.5 font-medium transition-all ${
              metricView === "both"
                ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-glow-sm"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Combined
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="mt-2 h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={formattedData}
            margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="outputGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={fuelHex} stopOpacity={0.4} />
                <stop offset="95%" stopColor={fuelHex} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="time"
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              interval={8}
            />
            <YAxis
              yAxisId="left"
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v >= 1000 ? (v / 1000).toFixed(1) + "k" : v}`}
            />
            {metricView === "both" && (
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#f59e0b"
                fontSize={9}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `$${v}`}
              />
            )}
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-lg border border-surface-border bg-slate-950/95 p-2 shadow-2xl backdrop-blur-md text-[11px] text-white">
                      <div className="font-mono text-gray-400">{label} UTC</div>
                      {payload.map((entry: any, i: number) => (
                        <div
                          key={i}
                          className="flex items-center justify-between gap-3 font-mono"
                        >
                          <span style={{ color: entry.color }}>
                            {entry.name}:
                          </span>
                          <span className="font-bold">
                            {entry.name === "Output (MW)"
                              ? `${entry.value.toLocaleString()} MW`
                              : `$${entry.value}/MWh`}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            {(metricView === "output" || metricView === "both") && (
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="output"
                name="Output (MW)"
                stroke={fuelHex}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#outputGradient)"
              />
            )}
            {(metricView === "price" || metricView === "both") && (
              <Line
                yAxisId={metricView === "both" ? "right" : "left"}
                type="monotone"
                dataKey="price"
                name="LMP Price ($/MWh)"
                stroke="#f59e0b"
                strokeWidth={1.5}
                dot={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend Note */}
      <div className="mt-1 flex items-center justify-between text-[10px] text-gray-400">
        <div className="flex items-center gap-1.5">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: fuelHex }}
          />
          <span>Generation (MW)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          <span>Spot LMP ($/MWh)</span>
        </div>
      </div>
    </div>
  );
}
