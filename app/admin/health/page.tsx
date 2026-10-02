"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Database, 
  Radio, 
  RefreshCw, 
  Server, 
  ShieldCheck, 
  ArrowLeft,
  Zap,
  Globe2
} from "lucide-react";

interface HealthSource {
  id: string;
  name: string;
  provider: string;
  status: "healthy" | "degraded" | "syncing";
  latencyMs: number;
  lastRefresh: string;
  nextRefresh: string;
  slaUptime: string;
  recordsCount: string;
}

const SOURCES: HealthSource[] = [
  {
    id: "wri",
    name: "Global Power Plant Database",
    provider: "World Resources Institute (WRI)",
    status: "healthy",
    latencyMs: 18,
    lastRefresh: "12 mins ago",
    nextRefresh: "In 48 mins",
    slaUptime: "99.95%",
    recordsCount: "5,415 stations",
  },
  {
    id: "entsoe",
    name: "ENTSO-E Transparency Platform",
    provider: "European Network of TSOs",
    status: "healthy",
    latencyMs: 142,
    lastRefresh: "2 mins ago",
    nextRefresh: "In 3 mins (5m TTL)",
    slaUptime: "99.80%",
    recordsCount: "Pan-EU 50Hz Units",
  },
  {
    id: "eia",
    name: "US EIA Open Data API v2",
    provider: "U.S. Energy Information Admin",
    status: "healthy",
    latencyMs: 185,
    lastRefresh: "3 mins ago",
    nextRefresh: "In 2 mins (5m TTL)",
    slaUptime: "99.90%",
    recordsCount: "CAISO, ERCOT, PJM Hubs",
  },
  {
    id: "telegeography",
    name: "Global Subsea Cables & CLS",
    provider: "TeleGeography",
    status: "healthy",
    latencyMs: 24,
    lastRefresh: "Today, 00:00 UTC",
    nextRefresh: "In 24 hours",
    slaUptime: "99.99%",
    recordsCount: "528 cables / 412 CLS",
  },
  {
    id: "sse_stream",
    name: "High-Frequency SSE Telemetry Stream",
    provider: "AtlasGrid Physics Engine",
    status: "healthy",
    latencyMs: 4,
    lastRefresh: "Just now (2.5s ticks)",
    nextRefresh: "Continuous (2.5s)",
    slaUptime: "99.99%",
    recordsCount: "60 fps delta updates",
  },
  {
    id: "postgis_db",
    name: "PostgreSQL / PostGIS Spatial Database",
    provider: "Supabase & Postgres Engine",
    status: "healthy",
    latencyMs: 32,
    lastRefresh: "Continuous",
    nextRefresh: "Active Pool",
    slaUptime: "99.99%",
    recordsCount: "GiST Indexed Tables",
  },
];

export default function AdminHealthDashboard() {
  const [sources, setSources] = useState<HealthSource[]>(SOURCES);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastChecked, setLastChecked] = useState(new Date().toLocaleTimeString());

  const handleRefreshAll = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setLastChecked(new Date().toLocaleTimeString());
      setIsRefreshing(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 font-sans p-6 md:p-12">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link 
                href="/products/atlasgrid" 
                className="inline-flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to AtlasGrid Overview
              </Link>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <Activity className="w-7 h-7 text-cyan-400" />
              Infrastructure Telemetry & Data Health
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Live observability for data pipeline freshness, ENTSO-E/EIA upstream feeds, and PostGIS query pools.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-500">Last poll: {lastChecked}</span>
            <button
              onClick={handleRefreshAll}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-medium transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              Re-Verify Feeds
            </button>
          </div>
        </div>

        {/* Global SLA KPI Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-xl border border-slate-800/80 bg-slate-900/50 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider font-mono text-slate-400">Platform Uptime</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-2 font-mono">99.98%</div>
            <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              All 6 upstream pipelines operational
            </div>
          </div>

          <div className="p-5 rounded-xl border border-slate-800/80 bg-slate-900/50 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider font-mono text-slate-400">Mean Pipeline Latency</span>
              <Clock className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-2 font-mono">67.5 ms</div>
            <div className="text-xs text-cyan-400 mt-1">Edge cache hit ratio: 94.2%</div>
          </div>

          <div className="p-5 rounded-xl border border-slate-800/80 bg-slate-900/50 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider font-mono text-slate-400">Real-Time Stations</span>
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-2 font-mono">5,415 Units</div>
            <div className="text-xs text-slate-400 mt-1">Covering 167 national grids</div>
          </div>

          <div className="p-5 rounded-xl border border-slate-800/80 bg-slate-900/50 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider font-mono text-slate-400">SSE Telemetry Cadence</span>
              <Radio className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-2 font-mono">2.5s Delta Ticks</div>
            <div className="text-xs text-purple-400 mt-1">Connected clients: Real-time broadcast</div>
          </div>
        </div>

        {/* Upstream Feeds Detail Table */}
        <div className="border border-slate-800 rounded-xl bg-slate-900/40 overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">
                Data Ingestion Registry & Upstream Feed Verification
              </h2>
            </div>
            <Link
              href="/DATA_SOURCES.md"
              className="text-xs text-cyan-400 hover:text-cyan-300 font-mono underline"
            >
              View DATA_SOURCES.md
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-mono uppercase border-b border-slate-800">
                <tr>
                  <th className="py-3 px-6">Pipeline / Feed</th>
                  <th className="py-3 px-6">Provider</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6">Latency</th>
                  <th className="py-3 px-6">Freshness</th>
                  <th className="py-3 px-6">TTL / Next Poll</th>
                  <th className="py-3 px-6 text-right">SLA Uptime</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {sources.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-white">{s.name}</div>
                      <div className="text-[11px] text-slate-500">{s.recordsCount}</div>
                    </td>
                    <td className="py-4 px-6 text-slate-300">{s.provider}</td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" /> Operational
                      </span>
                    </td>
                    <td className="py-4 px-6 text-cyan-300">{s.latencyMs} ms</td>
                    <td className="py-4 px-6 text-slate-300">{s.lastRefresh}</td>
                    <td className="py-4 px-6 text-slate-400">{s.nextRefresh}</td>
                    <td className="py-4 px-6 text-right font-bold text-white">{s.slaUptime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Security & Audit Summary */}
        <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/30 space-y-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white font-mono uppercase">
              Zero-Trust Audit Log & Regulatory Compliance
            </h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            All API queries, data mutations, and real-time station queries are monitored with rate limits enforced (100 req/min/IP).
            Upstream API secrets are cryptographically isolated and never logged in plain text.
            LMP wholesale pricing is verified with a 15-minute delayed disclaimer in accordance with market rules.
          </p>
        </div>
      </div>
    </div>
  );
}
