import React from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Zap, 
  ShieldCheck, 
  Sparkles, 
  Building2, 
  HelpCircle,
  Clock,
  Radio,
  Download
} from "lucide-react";

export default function AtlasGridPricingPage() {
  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#070b14]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link
            href="/products/atlasgrid"
            className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to AtlasGrid
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/products/atlasgrid/signin"
              className="text-xs font-mono text-slate-400 hover:text-white transition-colors"
            >
              Sign In
            </Link>
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

      <main className="mx-auto max-w-7xl px-6 py-16 space-y-16">
        {/* Title Block */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-3.5 py-1 text-xs font-mono text-cyan-400">
            <Sparkles className="h-3.5 w-3.5" />
            Commercial Licensing & Advisory
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
            Transparent Pricing for High-Stakes Infrastructure
          </h1>
          <p className="text-sm sm:text-base text-slate-400 font-sans">
            Whether you are evaluating your first GPU cluster site or underwriting a 1GW sovereign campus, AtlasGrid delivers institutional precision.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {/* Tier 1: Free Explorer */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">Explorer Tier</div>
              <h3 className="text-2xl font-bold text-white">Free Analyst</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white font-mono">$0</span>
                <span className="text-xs text-slate-500 font-mono">/ forever</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ideal for researchers, students, and early-stage infrastructure teams evaluating regional grid concepts.
              </p>

              <div className="h-[1px] bg-slate-800 my-4" />

              <ul className="space-y-3 text-xs text-slate-300 font-mono">
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-cyan-400 shrink-0" />
                  <span>5,400+ Global Power Stations</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-cyan-400 shrink-0" />
                  <span>4,380+ Verified Data Centers</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-cyan-400 shrink-0" />
                  <span>1 Custom Saved Spatial View</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-cyan-400 shrink-0" />
                  <span>24-Hour Historical Replay</span>
                </li>
                <li className="flex items-center gap-2.5 text-slate-500">
                  <Clock className="h-4 w-4 text-slate-600 shrink-0" />
                  <span>15-Minute Delayed LMP Data</span>
                </li>
              </ul>
            </div>

            <Link
              href="/products/atlasgrid/signin"
              className="w-full text-center rounded-xl border border-slate-700 bg-slate-900 py-3 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
            >
              Sign Up Free
            </Link>
          </div>

          {/* Tier 2: Pro (Featured) */}
          <div className="relative rounded-2xl border-2 border-cyan-500 bg-gradient-to-b from-cyan-950/20 via-slate-900/60 to-slate-950/80 p-8 flex flex-col justify-between space-y-6 shadow-2xl shadow-cyan-500/10">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-cyan-500 px-3.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-950">
              Most Popular
            </div>

            <div className="space-y-4">
              <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider">Professional Tier</div>
              <h3 className="text-2xl font-bold text-white">Institutional Pro</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-cyan-400 font-mono">$499</span>
                <span className="text-xs text-slate-400 font-mono">/ month</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                For hyperscale procurement teams, energy traders, and corporate development modeling multi-site tenders.
              </p>

              <div className="h-[1px] bg-cyan-500/30 my-4" />

              <ul className="space-y-3 text-xs text-slate-200 font-mono">
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-cyan-400 shrink-0" />
                  <span><strong>Unlimited</strong> Saved Views & Custom Geofences</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-cyan-400 shrink-0" />
                  <span><strong>12-Month</strong> Historical Time Machine Replay</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-cyan-400 shrink-0" />
                  <span>Live 2.5s Real-Time SSE Telemetry Stream</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-cyan-400 shrink-0" />
                  <span>Real-Time LMP Spike & Curtailment Webhooks</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-cyan-400 shrink-0" />
                  <span>Full GeoJSON, Shapefile & CSV Dataset Exports</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-cyan-400 shrink-0" />
                  <span>Institutional Siting Dossier Generator</span>
                </li>
              </ul>
            </div>

            <Link
              href="/products/atlasgrid/signin"
              className="w-full text-center rounded-xl bg-cyan-500 py-3 text-xs font-semibold text-slate-950 shadow-lg shadow-cyan-500/30 hover:bg-cyan-400 transition-colors"
            >
              Get Started with Pro
            </Link>
          </div>

          {/* Tier 3: Enterprise */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="text-xs font-mono text-purple-400 uppercase tracking-wider">Enterprise & Advisory</div>
              <h3 className="text-2xl font-bold text-white">Sovereign Cluster</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white font-mono">Custom</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                For hyperscalers, sovereign wealth funds, and utilities building GW-scale AI campuses with bespoke transmission models.
              </p>

              <div className="h-[1px] bg-slate-800 my-4" />

              <ul className="space-y-3 text-xs text-slate-300 font-mono">
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-purple-400 shrink-0" />
                  <span>Dedicated PostGIS Cluster with 99.99% SLA</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-purple-400 shrink-0" />
                  <span>Private Behind-The-Meter (BTM) Feasibility Engine</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-purple-400 shrink-0" />
                  <span>Custom Substation SCADA & Interconnect Injection</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-purple-400 shrink-0" />
                  <span>Team RBAC with SAML 2.0 / Okta SSO</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-purple-400 shrink-0" />
                  <span>Dedicated AInframework Senior Energy Advisory Partner</span>
                </li>
              </ul>
            </div>

            <a
              href="mailto:infrastructure@ainframework.com?subject=AtlasGrid%20Enterprise%20Inquiry"
              className="w-full text-center rounded-xl border border-purple-500/40 bg-purple-500/10 py-3 text-xs font-semibold text-purple-300 hover:bg-purple-500/20 transition-colors"
            >
              Contact Infrastructure Team
            </a>
          </div>
        </div>

        {/* FAQ Section */}
        <section className="border-t border-slate-800 pt-16 max-w-3xl mx-auto space-y-8">
          <h2 className="text-2xl font-bold text-white text-center">Frequently Asked Questions</h2>

          <div className="space-y-6 text-xs sm:text-sm">
            <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-5 space-y-2">
              <h4 className="font-semibold text-white">How does email-only sign-up work?</h4>
              <p className="text-slate-400 leading-relaxed">
                You enter your work email, and our zero-trust token engine immediately issues a cryptographically signed 15-minute access token and 7-day refresh token stored in secure httpOnly cookies. No password creation or credential maintenance required.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-5 space-y-2">
              <h4 className="font-semibold text-white">Why is wholesale LMP pricing delayed on the Free tier?</h4>
              <p className="text-slate-400 leading-relaxed">
                Wholesale wholesale Locational Marginal Pricing (LMP) published by US RTOs and ENTSO-E is subject to regional market settlement rules. The Free tier includes verified 15-minute delayed data, while Pro and Enterprise tiers access live streaming telemetry feeds.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-5 space-y-2">
              <h4 className="font-semibold text-white">Can we export datasets for internal investment committee memos?</h4>
              <p className="text-slate-400 leading-relaxed">
                Yes. Pro and Enterprise subscribers can export substation POI tables, power plant fuel mix histories, and multi-site scoring dossiers as formatted CSV, GeoJSON, and PDF institutional summaries.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
