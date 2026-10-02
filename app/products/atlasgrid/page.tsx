import React from "react";
import Link from "next/link";
import { 
  Zap, 
  Server, 
  Activity, 
  TrendingUp, 
  ShieldCheck, 
  MapPin, 
  Layers, 
  History, 
  Search, 
  ArrowRight, 
  CheckCircle2, 
  ChevronRight,
  Database,
  Sliders,
  Cpu,
  BarChart3
} from "lucide-react";

export default function AtlasGridProductPage() {
  return (
    <div className="relative min-h-screen bg-[#070b14] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Background Grid Pattern & Radial Glow */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#070b14]/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-bold tracking-tight text-white">AtlasGrid</span>
              <span className="ml-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-mono font-medium text-cyan-400">
                AInframework
              </span>
            </div>
          </div>

          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-xs font-mono text-slate-400 hover:text-white transition-colors">Features</a>
            <a href="#use-cases" className="text-xs font-mono text-slate-400 hover:text-white transition-colors">Use Cases</a>
            <a href="#how-it-works" className="text-xs font-mono text-slate-400 hover:text-white transition-colors">Workflow</a>
            <a href="#data-sources" className="text-xs font-mono text-slate-400 hover:text-white transition-colors">Data Sources</a>
            <Link href="/admin/health" className="text-xs font-mono text-slate-400 hover:text-cyan-400 transition-colors">
              Health Dashboard
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/products/atlasgrid/signin"
              className="text-xs font-mono text-slate-300 hover:text-white transition-colors px-3 py-1.5"
            >
              Sign In
            </Link>
            <Link
              href="/products/atlasgrid/demo"
              className="group inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-medium text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all"
            >
              Launch Demo
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-20 pb-24 md:pt-28 md:pb-32">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
              {/* Left Column: Messaging */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-3.5 py-1 text-xs font-mono text-cyan-400">
                  <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                  Infrastructure Intelligence
                </div>

                <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.1]">
                  Global Power Grid & Data Center Observability
                </h1>

                <p className="text-lg font-medium text-cyan-200/90 font-mono">
                  See where the grid flows, where the GPUs land, and what it costs to power them.
                </p>

                <p className="text-sm leading-relaxed text-slate-400">
                  Understand energy availability, spot-market pricing, and physical constraints before committing to data center expansion or GPU allocation. AtlasGrid combines 5,200+ global power stations, real-time Locational Marginal Pricing from US ISOs and ENTSO-E, and 4,380+ compute facilities into one interactive map.
                </p>

                {/* Target Audience Badges */}
                <div className="grid grid-cols-2 gap-3 pt-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 p-2.5">
                    <Server className="h-4 w-4 text-cyan-400 shrink-0" />
                    <span><strong>Infrastructure Teams:</strong> DC builds & siting</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 p-2.5">
                    <TrendingUp className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span><strong>Finance & FinOps:</strong> Energy-cost modeling</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 p-2.5">
                    <Cpu className="h-4 w-4 text-purple-400 shrink-0" />
                    <span><strong>Supply Chain:</strong> GPU capacity & SLAs</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 p-2.5">
                    <Activity className="h-4 w-4 text-amber-400 shrink-0" />
                    <span><strong>Energy Traders:</strong> Grid events & arbitrage</span>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-wrap items-center gap-4 pt-4">
                  <Link
                    href="/products/atlasgrid/demo"
                    className="inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-cyan-500/25 hover:opacity-95 transition-all"
                  >
                    Launch Interactive Demo
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/DATA_SOURCES.md"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-6 py-3.5 text-sm font-medium text-slate-300 hover:border-slate-600 hover:text-white transition-all"
                  >
                    Data Governance & SLAs
                  </Link>
                </div>
              </div>

              {/* Right Column: Visual Preview Card */}
              <div className="lg:col-span-5">
                <div className="relative rounded-2xl border border-cyan-500/30 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-5 shadow-2xl backdrop-blur-xl">
                  {/* Top Bar of Window */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                      <span className="ml-2 text-[11px] font-mono text-slate-400">AtlasGrid Telemetry Viewport</span>
                    </div>
                    <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono text-emerald-400 border border-emerald-500/20">
                      LIVE 2.5s
                    </span>
                  </div>

                  {/* Simulated Telemetry HUD Matrix */}
                  <div className="space-y-3 font-mono text-xs">
                    <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3 space-y-2">
                      <div className="flex justify-between text-slate-400">
                        <span>PJM WESTERN HUB LMP</span>
                        <span className="text-white font-bold">$48.70 / MWh</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>CAISO 5-MIN SOLAR MIX</span>
                        <span className="text-cyan-400 font-bold">14,500 MW (58%)</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>ENTSO-E FREQUENCY</span>
                        <span className="text-emerald-400 font-bold">50.012 Hz</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="rounded-lg border border-slate-800/80 bg-slate-900/60 p-2.5">
                        <div className="text-[10px] text-slate-500 uppercase">Power Stations</div>
                        <div className="text-base font-bold text-cyan-300 mt-0.5">5,415 Units</div>
                      </div>
                      <div className="rounded-lg border border-slate-800/80 bg-slate-900/60 p-2.5">
                        <div className="text-[10px] text-slate-500 uppercase">AI Data Centers</div>
                        <div className="text-base font-bold text-purple-300 mt-0.5">4,380+ Sites</div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-3">
                      <div className="text-[11px] text-slate-400 mb-1.5 flex items-center justify-between">
                        <span>Locational Marginal Price Spread</span>
                        <span className="text-emerald-400 text-[10px]">Optimal Siting Corridor</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden flex">
                        <div className="bg-emerald-500 w-1/3" />
                        <div className="bg-cyan-500 w-1/4" />
                        <div className="bg-amber-500 w-1/4" />
                        <div className="bg-rose-500 w-1/6" />
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-500 mt-1">
                        <span>Clean Surplus</span>
                        <span>Normal</span>
                        <span>Peaker Ramp</span>
                        <span>Spike Alert</span>
                      </div>
                    </div>

                    <Link
                      href="/products/atlasgrid/demo"
                      className="block text-center rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 p-2.5 text-xs text-cyan-300 font-medium transition-colors"
                    >
                      Enter Fullscreen 3D Map →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: FEATURES */}
        <section id="features" className="border-t border-slate-800/80 bg-slate-950/60 py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
              <span className="text-xs font-mono uppercase tracking-widest text-cyan-400">Core Capabilities</span>
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Engineered for Hyperscale Infrastructure Underwriting
              </h2>
              <p className="text-sm text-slate-400">
                A unified spatial engine connecting power plants, high-voltage interconnectors, submarine fiber, and compute clusters.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-3 hover:border-cyan-500/40 transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  <Zap className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-white">5,200+ Global Power Stations</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Real generation data from WRI, ENTSO-E, and EIA across nuclear, gas, hydro, offshore wind, and utility solar arrays.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-3 hover:border-cyan-500/40 transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-white">Real-Time Pricing Grid</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Live Locational Marginal Pricing (LMP) heatmaps, spot-market spreads, and congestion breakdown from CAISO, ERCOT, and PJM.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-3 hover:border-cyan-500/40 transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400">
                  <Server className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-white">4,380+ Data Center Footprint</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Hyperscale, colocation, and enterprise facilities cross-referenced with power capacity, cooling methods, and hazard corridors.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-3 hover:border-cyan-500/40 transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400">
                  <Layers className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-white">Transmission Interconnectors</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  High-voltage DC & AC interties (Pacific DC Intertie, IFA-2, NordLink) mapped with dynamic directional flow telemetry.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-3 hover:border-cyan-500/40 transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <History className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-white">24-Hour Historical Replay</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Interactive time scrubber to analyze duck curves, severe weather outages, peaker unit dispatch, and negative pricing windows.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-3 hover:border-cyan-500/40 transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400">
                  <Search className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-white">Smart Filtering & Siting Scores</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Multi-variable search by fuel type, utility operator, free-cooling hours, seismic fault proximity, and 100-year flood risk.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: USE CASES */}
        <section id="use-cases" className="py-24 border-t border-slate-800">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
              <span className="text-xs font-mono uppercase tracking-widest text-cyan-400">Enterprise Applications</span>
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Who Relies on AtlasGrid
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-8 space-y-4">
                <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider">Use Case 01</div>
                <h3 className="text-xl font-bold text-white">Evaluate DC Site Economics</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Model 10-year electricity OpEx by evaluating historical LMP volatility, capacity market auctions, and substation interconnection distances before acquiring land parcels.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-8 space-y-4">
                <div className="text-xs font-mono text-purple-400 uppercase tracking-wider">Use Case 02</div>
                <h3 className="text-xl font-bold text-white">Source GPU Capacity Faster</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Locate colocation facilities with available MW headroom, dual-feed redundancy, and low IXP round-trip latency to accelerate multi-thousand GPU cluster deployments.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-8 space-y-4">
                <div className="text-xs font-mono text-amber-400 uppercase tracking-wider">Use Case 03</div>
                <h3 className="text-xl font-bold text-white">Monitor Grid Reliability Risk</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Track synchronous area frequency deviations, curtailment alerts, transmission bottlenecks, and extreme climate events (hurricanes, earthquakes) in real time.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-8 space-y-4">
                <div className="text-xs font-mono text-emerald-400 uppercase tracking-wider">Use Case 04</div>
                <h3 className="text-xl font-bold text-white">Energy Markets & Arbitrage</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Analyze inter-regional price spreads, battery storage arbitrage opportunities, and behind-the-meter colocation economics at operational power plants.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: HOW IT WORKS */}
        <section id="how-it-works" className="border-t border-slate-800/80 bg-slate-950/60 py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
              <span className="text-xs font-mono uppercase tracking-widest text-cyan-400">Streamlined Workflow</span>
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Get Started in Seconds
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 font-mono font-bold">1</div>
                <h3 className="text-lg font-semibold text-white">Sign In with Your Email</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  No complex password setup required. Provide your corporate email and infrastructure use case to gain instant analyst access.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 font-mono font-bold">2</div>
                <h3 className="text-lg font-semibold text-white">Explore the Global Map</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Switch between 3D globe and 2D Mercator projections, toggle transmission overlays, and inspect real-time 2.5s telemetry ticks.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 font-mono font-bold">3</div>
                <h3 className="text-lg font-semibold text-white">Underwrite Site Metrics</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Click any power station or data center node to open the Inspector Drawer for deep capacity, nodal LMP breakdown, and hazard reports.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: DATA BEHIND ATLASGRID */}
        <section id="data-sources" className="py-24 border-t border-slate-800">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
              <span className="text-xs font-mono uppercase tracking-widest text-cyan-400">Institutional Rigor</span>
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Data Behind AtlasGrid
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-6 space-y-3">
                <Database className="h-6 w-6 text-cyan-400" />
                <h3 className="text-base font-bold text-white">World Resources Institute (WRI)</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Global baseline covering 5,400+ operational power stations with rated capacity, fuel type, CO₂ intensity, and commissioning vintage.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-6 space-y-3">
                <Database className="h-6 w-6 text-emerald-400" />
                <h3 className="text-base font-bold text-white">ENTSO-E Transparency Platform</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Pan-European 50Hz generation per unit, Day-Ahead spot pricing, cross-border transmission flows, and grid frequency tracking.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-6 space-y-3">
                <Database className="h-6 w-6 text-purple-400" />
                <h3 className="text-base font-bold text-white">US EIA & Regional ISOs</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  CAISO, ERCOT, and PJM 5-minute real-time fuel mix, balancing authority demand, and locational marginal price formations.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA BAND */}
        <section className="border-t border-slate-800 bg-gradient-to-b from-[#070b14] to-[#0b1220] py-20 text-center">
          <div className="mx-auto max-w-4xl px-6 space-y-6">
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Ready to optimize your infrastructure?
            </h2>
            <p className="text-base text-slate-400">
              Launch the interactive demo now and explore global power availability and siting economics.
            </p>
            <div className="pt-2">
              <Link
                href="/products/atlasgrid/demo"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-4 text-sm font-semibold text-white shadow-xl shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 transition-all"
              >
                Launch Free Interactive Demo
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-10 text-center text-xs text-slate-500 font-mono">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>© 2026 AInframework Inc. AtlasGrid Infrastructure Intelligence.</div>
          <div className="flex items-center gap-6">
            <Link href="/DATA_SOURCES.md" className="hover:text-slate-300">Data Governance</Link>
            <Link href="/admin/health" className="hover:text-slate-300">System Health</Link>
            <Link href="/products/atlasgrid/signin" className="hover:text-slate-300">Analyst Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
