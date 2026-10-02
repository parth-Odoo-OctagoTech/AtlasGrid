import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AtlasGrid | Global Power Grid & Data Center Observability",
  description:
    "See where the grid flows, where the GPUs land, and what it costs to power them. Real-time LMP pricing, 5,400+ power stations, and 4,380+ data centers.",
  openGraph: {
    title: "AtlasGrid — Global Infrastructure Observability",
    description: "Global power grid and compute observability platform by AInframework.",
    siteName: "AInframework",
  },
};

export default function AtlasGridLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#070b14] text-slate-100">{children}</div>;
}
