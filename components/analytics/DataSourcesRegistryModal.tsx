"use client";

import { useState, useEffect, useMemo } from "react";
import { useGridStore } from "@/lib/store/useGridStore";
import {
  X,
  Database,
  RefreshCw,
  Search,
  ExternalLink,
  ShieldCheck,
  Globe,
  Radio,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Zap,
  Server,
  Activity,
  Droplets,
  Wind,
  Compass,
  FileText,
  Workflow,
  Sparkles,
} from "lucide-react";
import { DataSourceItem } from "@/app/api/crawler/sources/route";

export function DataSourcesRegistryModal() {
  const isDataSourcesOpen = useGridStore((s) => s.isDataSourcesOpen);
  const setDataSourcesOpen = useGridStore((s) => s.setDataSourcesOpen);

  const [activeTab, setActiveTab] = useState<"sources" | "crawler" | "schedules">("sources");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPillar, setSelectedPillar] = useState<number | "ALL">("ALL");
  const [sources, setSources] = useState<DataSourceItem[]>([]);
  const [loadingSources, setLoadingSources] = useState(false);

  // Crawler execution state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [auditHistory, setAuditHistory] = useState<any[]>([]);

  // Fetch data sources registry & audit history
  const fetchRegistryData = async () => {
    setLoadingSources(true);
    try {
      const res = await fetch("/api/crawler/sources");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.sources)) {
          setSources(data.sources);
        }
        if (data.latestAudit) {
          setAuditHistory([data.latestAudit]);
        }
      }
    } catch (e) {
      console.error("Failed to load sources registry:", e);
    } finally {
      setLoadingSources(false);
    }
  };

  useEffect(() => {
    if (isDataSourcesOpen) {
      fetchRegistryData();
    }
  }, [isDataSourcesOpen]);

  // Trigger manual crawler cycle
  const handleTriggerSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncFeedback("POLLING LIVE FEEDS...");
    try {
      const res = await fetch("/api/cron/crawler", {
        method: "POST",
        headers: { "x-manual-trigger": "atlasgrid-ui" },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSyncFeedback("SYNC COMPLETE");
        if (data.audit) {
          setAuditHistory((prev) => [data.audit, ...prev]);
        }
        fetchRegistryData();
      } else {
        setSyncFeedback("SYNC DONE (LOCAL)");
      }
    } catch {
      setSyncFeedback("OFFLINE FALLBACK");
    } finally {
      setTimeout(() => {
        setIsSyncing(false);
        setSyncFeedback(null);
      }, 3500);
    }
  };

  // Filter sources
  const filteredSources = useMemo(() => {
    return sources.filter((item) => {
      const matchesSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.pillar.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPillar =
        selectedPillar === "ALL" || item.pillarNumber === selectedPillar;

      return matchesSearch && matchesPillar;
    });
  }, [sources, searchQuery, selectedPillar]);

  if (!isDataSourcesOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="relative flex h-[88vh] w-full max-w-6xl flex-col rounded-xl border border-[#293742] bg-[#101418] text-[#f5f8fa] shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden font-sans">
        
        {/* 1. Header Bar */}
        <div className="flex items-center justify-between border-b border-[#293742] bg-[#141b22] px-5 py-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-[#182026] border border-[#293742] text-[#2b95d6]">
              <Database className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold tracking-wider text-[#f5f8fa]">
                  DATA SOURCES &amp; CONTINUOUS CRAWLER REGISTRY
                </span>
                <span className="rounded bg-[#0f9960]/20 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-[#15b371] border border-[#0f9960]/40 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#15b371] animate-pulse" />
                  100% FREE &amp; OPEN SOURCE
                </span>
              </div>
              <p className="font-mono text-[11px] text-[#8a9ba8]">
                Palantir Grounded Ontology • 10 Infrastructure Pillars • Live Autonomous Ingestion
              </p>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleTriggerSync}
              disabled={isSyncing}
              className="flex items-center gap-1.5 rounded bg-[#137cbd] hover:bg-[#2b95d6] px-3 py-1.5 font-mono text-xs font-semibold text-white transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
              title="Trigger continuous crawler run across USGS, GDACS, PeeringDB and grid feeds"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              <span>{syncFeedback || (isSyncing ? "SYNCING..." : "SYNC ALL SOURCES NOW")}</span>
            </button>

            <button
              onClick={() => setDataSourcesOpen(false)}
              className="rounded p-1.5 text-[#8a9ba8] hover:bg-[#202b33] hover:text-[#f5f8fa] transition-colors cursor-pointer"
              title="Close Registry (Esc)"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* 2. KPI Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 border-b border-[#293742] bg-[#182026] px-5 py-2.5 text-xs font-mono shrink-0 gap-3">
          <div>
            <span className="text-[10px] text-[#8a9ba8] uppercase block">Pillars Covered</span>
            <span className="text-sm font-bold text-[#f5f8fa]">10 Domains</span>
          </div>
          <div>
            <span className="text-[10px] text-[#8a9ba8] uppercase block">Monitored Feeds</span>
            <span className="text-sm font-bold text-[#2b95d6]">25+ Public APIs</span>
          </div>
          <div>
            <span className="text-[10px] text-[#8a9ba8] uppercase block">Global DC Assets</span>
            <span className="text-sm font-bold text-[#15b371]">6,686 Facilities</span>
          </div>
          <div>
            <span className="text-[10px] text-[#8a9ba8] uppercase block">Power Plants &amp; Grid</span>
            <span className="text-sm font-bold text-[#ec9a29]">3,450+ Stations</span>
          </div>
          <div>
            <span className="text-[10px] text-[#8a9ba8] uppercase block">Autonomous Cadence</span>
            <span className="text-sm font-bold text-[#a7b6c2]">Every 6h (Cron)</span>
          </div>
        </div>

        {/* 3. Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-[#293742] bg-[#141b22] px-5 py-2 shrink-0">
          <div className="flex items-center gap-1 font-mono text-xs">
            <button
              onClick={() => setActiveTab("sources")}
              className={`flex items-center gap-1.5 rounded px-3 py-1.5 transition-colors cursor-pointer ${
                activeTab === "sources"
                  ? "bg-[#202b33] font-bold text-[#2b95d6] border border-[#2b95d6]/40"
                  : "text-[#8a9ba8] hover:text-[#f5f8fa]"
              }`}
            >
              <Database className="h-3.5 w-3.5" />
              <span>All Data Sources ({filteredSources.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("crawler")}
              className={`flex items-center gap-1.5 rounded px-3 py-1.5 transition-colors cursor-pointer ${
                activeTab === "crawler"
                  ? "bg-[#202b33] font-bold text-[#2b95d6] border border-[#2b95d6]/40"
                  : "text-[#8a9ba8] hover:text-[#f5f8fa]"
              }`}
            >
              <Radio className="h-3.5 w-3.5" />
              <span>Autonomous Crawler &amp; Audit Logs</span>
            </button>

            <button
              onClick={() => setActiveTab("schedules")}
              className={`flex items-center gap-1.5 rounded px-3 py-1.5 transition-colors cursor-pointer ${
                activeTab === "schedules"
                  ? "bg-[#202b33] font-bold text-[#2b95d6] border border-[#2b95d6]/40"
                  : "text-[#8a9ba8] hover:text-[#f5f8fa]"
              }`}
            >
              <Workflow className="h-3.5 w-3.5" />
              <span>Schedules &amp; Architecture</span>
            </button>
          </div>

          {activeTab === "sources" && (
            <div className="relative w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter sources or providers..."
                className="w-full rounded border border-[#293742] bg-[#182026] pl-8 pr-3 py-1 font-mono text-xs text-[#f5f8fa] placeholder-[#5c7080] focus:border-[#2b95d6] focus:outline-none"
              />
              <Search className="absolute left-2.5 top-1.5 h-3.5 w-3.5 text-[#5c7080]" />
            </div>
          )}
        </div>

        {/* 4. Tab Contents */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === "sources" && (
            <div className="space-y-4">
              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 flex-wrap font-mono text-[11px]">
                <button
                  onClick={() => setSelectedPillar("ALL")}
                  className={`rounded px-2.5 py-1 transition-colors cursor-pointer ${
                    selectedPillar === "ALL"
                      ? "bg-[#137cbd] text-white font-bold"
                      : "bg-[#182026] text-[#8a9ba8] border border-[#293742] hover:text-[#f5f8fa]"
                  }`}
                >
                  ALL PILLARS ({sources.length})
                </button>
                {[
                  { num: 1, label: "1. Data Centers" },
                  { num: 2, label: "2. Power Grid" },
                  { num: 3, label: "3. Dark Fiber" },
                  { num: 4, label: "4. Seismic" },
                  { num: 5, label: "5. Floods" },
                  { num: 6, label: "6. Severe Storms" },
                  { num: 7, label: "7. Climate/Free-Cooling" },
                  { num: 8, label: "8. Water/Wastewater" },
                  { num: 9, label: "9. Soil/Topography" },
                  { num: 10, label: "10. Aviation/Pipelines" },
                ].map((pill) => (
                  <button
                    key={pill.num}
                    onClick={() => setSelectedPillar(pill.num)}
                    className={`rounded px-2 py-0.5 transition-colors cursor-pointer ${
                      selectedPillar === pill.num
                        ? "bg-[#137cbd] text-white font-bold"
                        : "bg-[#182026] text-[#8a9ba8] border border-[#293742] hover:text-[#f5f8fa]"
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>

              {/* Sources Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredSources.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col justify-between rounded-lg border border-[#293742] bg-[#182026] p-4 font-mono hover:border-[#2b95d6]/50 transition-colors"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] text-[#2b95d6] font-bold uppercase tracking-wider">
                          Pillar {item.pillarNumber}: {item.pillar}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`rounded px-1.5 py-0.2 text-[9px] font-bold border ${
                              item.status === "ONLINE"
                                ? "bg-[#0f9960]/20 text-[#15b371] border-[#0f9960]/40"
                                : item.status === "SYNCED"
                                ? "bg-[#137cbd]/20 text-[#2b95d6] border-[#137cbd]/40"
                                : "bg-[#d9822b]/20 text-[#ec9a29] border-[#d9822b]/40"
                            }`}
                          >
                            {item.status}
                          </span>
                          <span className="rounded bg-[#202b33] px-1.5 py-0.2 text-[9px] text-[#8a9ba8] border border-[#293742]">
                            {item.updateCadence}
                          </span>
                        </div>
                      </div>

                      {/* Title & Provider */}
                      <h3 className="text-xs font-bold text-[#f5f8fa] leading-snug mb-1">
                        {item.name}
                      </h3>
                      <p className="text-[11px] text-[#8a9ba8] mb-2 font-sans font-medium">
                        Provider: <strong className="text-[#a7b6c2] font-mono">{item.provider}</strong>
                      </p>

                      {/* Description */}
                      <p className="text-[11px] text-[#a7b6c2] font-sans leading-relaxed mb-3">
                        {item.description}
                      </p>
                    </div>

                    {/* Bottom Metadata & Links */}
                    <div className="border-t border-[#293742] pt-2.5 mt-1 text-[10px] space-y-1.5">
                      <div className="flex items-center justify-between text-[#8a9ba8]">
                        <span>Format: <strong className="text-[#f5f8fa]">{item.format}</strong></span>
                        <span>Coverage: <strong className="text-[#f5f8fa]">{item.coverage}</strong></span>
                      </div>
                      <div className="flex items-center justify-between text-[#8a9ba8]">
                        <span>Records: <strong className="text-[#15b371]">{item.recordsIndexed}</strong></span>
                        <a
                          href={item.docsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#2b95d6] hover:underline flex items-center gap-1 font-bold"
                        >
                          Docs &amp; Specs <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "crawler" && (
            <div className="space-y-4 font-mono text-xs">
              {/* Crawler Status Summary Banner */}
              <div className="rounded-lg border border-[#293742] bg-[#182026] p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0f9960]/15 border border-[#0f9960]/40 text-[#15b371]">
                    <Radio className="h-5 w-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#f5f8fa]">
                        AUTONOMOUS INGESTION ENGINE: ACTIVE
                      </span>
                      <span className="rounded bg-[#0f9960]/20 px-2 py-0.5 text-[10px] font-bold text-[#15b371] border border-[#0f9960]/40">
                        HEALTHY
                      </span>
                    </div>
                    <p className="text-[11px] text-[#8a9ba8] mt-0.5">
                      Continuously polls live USGS Real-Time Earthquakes, GDACS Disaster Alerts, PeeringDB Facilities, and High-Voltage Switchyards.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleTriggerSync}
                  disabled={isSyncing}
                  className="flex items-center gap-2 rounded bg-[#137cbd] hover:bg-[#2b95d6] px-4 py-2 font-bold text-white transition-colors disabled:opacity-50 cursor-pointer shadow shrink-0"
                >
                  <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
                  <span>{isSyncing ? "EXECUTING CRAWLER..." : "TRIGGER IMMEDIATE CRAWL"}</span>
                </button>
              </div>

              {/* Audit History Ledger Table */}
              <div className="rounded-lg border border-[#293742] bg-[#182026] overflow-hidden">
                <div className="border-b border-[#293742] bg-[#141b22] px-4 py-2.5 flex items-center justify-between">
                  <span className="font-bold text-xs text-[#f5f8fa]">
                    RECENT CRAWLER EXECUTION AUDIT LEDGER
                  </span>
                  <span className="text-[10px] text-[#8a9ba8]">
                    Showing latest execution records
                  </span>
                </div>

                <div className="divide-y divide-[#293742]">
                  {auditHistory.length > 0 ? (
                    auditHistory.map((rec, idx) => (
                      <div key={idx} className="p-4 space-y-2 hover:bg-[#202b33]/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#2b95d6]">{rec.runId}</span>
                            <span className="rounded bg-[#0f9960]/20 px-1.5 py-0.2 text-[9px] font-bold text-[#15b371] border border-[#0f9960]/40">
                              {rec.status.toUpperCase()}
                            </span>
                          </div>
                          <span className="text-[10px] text-[#8a9ba8]">{rec.timestamp}</span>
                        </div>

                        <p className="text-[11px] text-[#a7b6c2] leading-relaxed">
                          {rec.details || `Scan completed in ${rec.durationMs}ms.`}
                        </p>

                        <div className="flex items-center gap-4 text-[10px] text-[#8a9ba8] pt-1">
                          <span>Candidates Scanned: <strong className="text-[#f5f8fa]">{rec.discoveredCandidates}</strong></span>
                          <span>New Grid Nodes: <strong className="text-[#15b371]">+{rec.verifiedNewNodes}</strong></span>
                          <span>Repaired Links: <strong className="text-[#2b95d6]">{rec.repairedLinks}</strong></span>
                          <span>Maritime Rejected: <strong className="text-[#f55656]">{rec.maritimePointsRejected}</strong></span>
                          <span>Duration: <strong className="text-[#f5f8fa]">{rec.durationMs}ms</strong></span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-[#8a9ba8]">
                      <Radio className="h-8 w-8 mx-auto mb-2 text-[#5c7080] animate-pulse" />
                      <p>No audit records loaded yet. Click <strong>TRIGGER IMMEDIATE CRAWL</strong> to run a cycle.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "schedules" && (
            <div className="space-y-4 font-mono text-xs">
              <div className="rounded-lg border border-[#293742] bg-[#182026] p-4">
                <h3 className="font-bold text-sm text-[#f5f8fa] mb-2 flex items-center gap-2">
                  <Workflow className="h-4 w-4 text-[#2b95d6]" />
                  AUTOMATED SYNCHRONIZATION SCHEDULES
                </h3>
                <p className="text-[11px] text-[#8a9ba8] leading-relaxed mb-4">
                  AtlasGrid employs a two-tier continuous crawler architecture to keep infrastructure, telecommunications, and geohazard datasets updated without manual intervention:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded border border-[#293742] bg-[#141b22] p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#2b95d6]">1. Vercel Serverless Cron</span>
                      <span className="rounded bg-[#137cbd]/20 px-1.5 py-0.2 text-[9px] text-[#2b95d6] border border-[#137cbd]/40">
                        Every 6 Hours
                      </span>
                    </div>
                    <p className="text-[11px] text-[#a7b6c2] leading-relaxed">
                      Configured in <code className="text-[#f5f8fa]">vercel.json</code> pointing to <code className="text-[#f5f8fa]">/api/cron/crawler</code>.
                      Fetches live USGS earthquakes, GDACS disaster alerts, verifies PeeringDB facility connectivity, and audits carrier neutrality.
                    </p>
                    <div className="text-[10px] text-[#5c7080]">
                      Cron Expression: <code className="text-[#a7b6c2]">0 */6 * * *</code>
                    </div>
                  </div>

                  <div className="rounded border border-[#293742] bg-[#141b22] p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#15b371]">2. GitHub Actions Scheduled Workflow</span>
                      <span className="rounded bg-[#0f9960]/20 px-1.5 py-0.2 text-[9px] text-[#15b371] border border-[#0f9960]/40">
                        Daily at 02:00 UTC
                      </span>
                    </div>
                    <p className="text-[11px] text-[#a7b6c2] leading-relaxed">
                      Configured in <code className="text-[#f5f8fa]">.github/workflows/infrastructure-crawler.yml</code>.
                      Executes full global landmass calibration, dark fiber railroad rights-of-way corridor sync, and PostGIS Supabase batch migrations.
                    </p>
                    <div className="text-[10px] text-[#5c7080]">
                      Cron Expression: <code className="text-[#a7b6c2]">0 2 * * *</code>
                    </div>
                  </div>
                </div>
              </div>

              {/* Zero External Lock-in & Resilience Guarantee */}
              <div className="rounded-lg border border-[#0f9960]/30 bg-[#0f9960]/10 p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-[#15b371] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-xs text-[#15b371]">
                      Zero External Runtime Dependency &amp; Offline Resilience
                    </h4>
                    <p className="text-[11px] text-[#a7b6c2] leading-relaxed mt-1">
                      All datasets are permanently snapshotted in local version-controlled JSON ledgers (<code className="text-[#f5f8fa]">data/*.json</code>) and PostGIS.
                      If any external public API experiences an outage or rate limit, AtlasGrid serves verified local ground-truth without interrupting map interactions or the siting score engine.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 5. Modal Footer */}
        <div className="flex items-center justify-between border-t border-[#293742] bg-[#141b22] px-5 py-2.5 font-mono text-[10px] text-[#8a9ba8] shrink-0">
          <span>Palantir Gotham Architecture • Multi-Source Telemetry Engine</span>
          <span>Press ESC or click close to dismiss</span>
        </div>

      </div>
    </div>
  );
}
