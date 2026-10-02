/**
 * Site Navigation Registry for AInframework × AtlasGrid Platform
 */

export interface NavItem {
  href: string;
  name: string;
  layer?: "compute" | "platform" | "data" | "advisory";
  description?: string;
  badge?: string;
  external?: boolean;
}

export const capabilities: NavItem[] = [
  {
    href: "/products/atlasgrid",
    name: "AtlasGrid",
    layer: "compute",
    description: "Global power grid and data center observability for infrastructure planning and GPU sourcing.",
    badge: "Live Telemetry",
  },
  {
    href: "/products/observability",
    name: "AI Observability",
    layer: "platform",
    description: "Distributed trace inspection, token economics, and LLM latency optimization.",
  },
  {
    href: "/products/finops",
    name: "FinOps & Cloud Siting",
    layer: "compute",
    description: "Real-time energy cost modeling, locational marginal pricing arbitrage, and PUE tracking.",
  },
  {
    href: "/advisory",
    name: "Infrastructure Advisory",
    layer: "advisory",
    description: "Turnkey hyperscale siting, utility interconnect negotiation, and clean energy procurement.",
  },
];

export const mainNav: NavItem[] = [
  { href: "/products/atlasgrid", name: "AtlasGrid" },
  { href: "/products/atlasgrid/demo", name: "Interactive Map" },
  { href: "/admin/health", name: "Grid Health & Freshness" },
  { href: "/products/atlasgrid/signin", name: "Sign In" },
];

export const siteConfig = {
  name: "AtlasGrid by AInframework",
  tagline: "See where the grid flows, where the GPUs land, and what it costs to power them.",
  headline: "AtlasGrid: Global Power Grid & Data Center Observability",
  contactEmail: "infrastructure@ainframework.com",
  docsUrl: "/DATA_SOURCES.md",
};
