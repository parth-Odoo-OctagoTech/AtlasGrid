import React from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  TrendingDown, 
  Clock, 
  Zap, 
  Server, 
  ShieldCheck, 
  DollarSign, 
  Cpu, 
  FileText,
  BarChart3
} from "lucide-react";

export default function AtlasGridCaseStudyPage() {
  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Breadcrumb Header */}
      <header className="border-b border-slate-800 bg-[#070b14]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link
            href="/products/atlasgrid"
            className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to AtlasGrid
          </Link>

          <div className="flex items-center gap-4">
            <span className="rounded-full border border-cyan-500/30 bg-cyan-950/60 px-3 py-1 text-[11px] font-mono text-cyan-300">
              Institutional Case Study
            </span>
            <Link
              href="/products/atlasgrid/demo"
              className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 hover:bg-cyan-400 transition-colors"
            >
              Launch Demo
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-16 space-y-12">
        {/* Title Block */}
        <div className="space-y-4">
          <div className="text-xs font-mono uppercase tracking-widest text-cyan-400">
            AInframework Advisory & Siting Intelligence
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            How AInframework Sited a 250MW Hyperscale AI Campus in 11 Days Using AtlasGrid
          </h1>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-sans">
            By overlaying real-time wholesale LMP data, substation POI headroom, and free-cooling climatology, AInframework eliminated a 4-year utility queue bottleneck and unlocked $18.4M in annual power OpEx savings.
          </p>
        </div>

        {/* ROI Metrics Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-y border-slate-800 py-8">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase">
              <Clock className="h-4 w-4 text-cyan-400" /> Due Diligence Time
            </div>
            <div className="text-3xl font-extrabold text-white font-mono">11 Days</div>
            <div className="text-xs text-emerald-400">Reduced from 6 months (84% faster)</div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase">
              <DollarSign className="h-4 w-4 text-emerald-400" /> Annual Power OpEx
            </div>
            <div className="text-3xl font-extrabold text-emerald-400 font-mono">-$18.4M / yr</div>
            <div className="text-xs text-slate-400">Optimized blended power tariff</div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase">
              <Zap className="h-4 w-4 text-purple-400" /> Clean Energy Share
            </div>
            <div className="text-3xl font-extrabold text-purple-300 font-mono">92% CFE</div>
            <div className="text-xs text-slate-400">24/7 Carbon-Free Energy matching</div>
          </div>
        </div>

        {/* Challenge Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white tracking-tight">The Challenge: The 5-Year Interconnection Wall</h2>
          <p className="text-sm leading-relaxed text-slate-300">
            A leading AI research institution needed to secure <strong>250MW of high-density critical power</strong> by late 2026 to host 65,000 next-generation Blackwell GPUs. The traditional strategy of sourcing land parcels in Data Center Alley (Ashburn, VA) hit severe headwinds:
          </p>
          <ul className="space-y-2 text-xs text-slate-400 list-disc list-inside">
            <li>Dominion Energy transmission substation delays exceeding 48 months for 200MW+ requests.</li>
            <li>Industrial power rates climbing above <strong>$0.082 / kWh</strong> under Schedule GS-4.</li>
            <li>Zero local dark fiber conduit expansion capacity across primary transatlantic cable landing corridors.</li>
          </ul>
        </section>

        {/* The AtlasGrid Multi-Variable Analysis */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-white tracking-tight">The Solution: Multi-Layer Spatial Screening</h2>
          <p className="text-sm leading-relaxed text-slate-300">
            Using AtlasGrid, AInframework deployed a multi-regional automated screen across 5,400+ power stations, 3,000+ substations, and 4,380+ compute nodes to evaluate three candidate corridors:
          </p>

          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Candidate Corridor</th>
                  <th className="py-3 px-4">Power Tariff ($/kWh)</th>
                  <th className="py-3 px-4">Substation Headroom</th>
                  <th className="py-3 px-4">Free-Cooling Hours</th>
                  <th className="py-3 px-4">Grid Risk Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                <tr className="hover:bg-slate-800/20">
                  <td className="py-3 px-4 font-semibold text-white">Northern Virginia (PJM)</td>
                  <td className="py-3 px-4">$0.082</td>
                  <td className="py-3 px-4 text-rose-400">Deficit (-120MW)</td>
                  <td className="py-3 px-4">5,850 hrs/yr</td>
                  <td className="py-3 px-4 text-amber-400">High Congestion</td>
                </tr>
                <tr className="hover:bg-slate-800/20">
                  <td className="py-3 px-4 font-semibold text-white">West Texas (ERCOT)</td>
                  <td className="py-3 px-4">$0.068</td>
                  <td className="py-3 px-4 text-emerald-400">Available (+340MW)</td>
                  <td className="py-3 px-4">4,120 hrs/yr</td>
                  <td className="py-3 px-4 text-rose-400">Summer Price Spikes</td>
                </tr>
                <tr className="bg-cyan-950/20 border-l-2 border-cyan-400">
                  <td className="py-3 px-4 font-bold text-cyan-300">Pacific Northwest / Quebec</td>
                  <td className="py-3 px-4 font-bold text-emerald-400">$0.048 - $0.054</td>
                  <td className="py-3 px-4 text-emerald-400">Available (+450MW)</td>
                  <td className="py-3 px-4 font-bold text-cyan-300">6,840 hrs/yr</td>
                  <td className="py-3 px-4 text-emerald-400">Baseload Hydro Stability</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Execution & Strategic Outcome */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white tracking-tight">The Outcome: Behind-The-Meter Hydro Underwriting</h2>
          <p className="text-sm leading-relaxed text-slate-300">
            AtlasGrid identified a direct 230kV transmission intertie located 4.2 miles from a high-capacity hydroelectric dam with an active substation bus bay. Rather than waiting on utility interconnection queues, the client negotiated a <strong>Behind-The-Meter (BTM) power purchase agreement</strong>:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold">
                <CheckCircle2 className="h-4 w-4" /> 18-Month Deployment Window
              </div>
              <p className="text-xs text-slate-400">
                Bypassed the 4-year PJM queue by utilizing existing generator POI capacity with non-firm energy curtailment guarantees.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold">
                <CheckCircle2 className="h-4 w-4" /> 6,840 Free-Cooling Hours
              </div>
              <p className="text-xs text-slate-400">
                Low wet-bulb temperatures reduced chiller operating hours by 72%, resulting in an annualized design PUE of 1.14.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-slate-950/80 p-8 text-center space-y-4">
          <h3 className="text-xl sm:text-2xl font-bold text-white">Evaluate Your Siting Portfolio with AtlasGrid</h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Test candidate data center coordinates against 5,200+ power stations, 10-year climate profiles, and real-time LMP formation.
          </p>
          <div className="pt-2">
            <Link
              href="/products/atlasgrid/demo"
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-6 py-3 text-xs font-semibold text-slate-950 shadow-lg shadow-cyan-500/25 hover:bg-cyan-400 transition-all"
            >
              Launch Interactive Demo
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
