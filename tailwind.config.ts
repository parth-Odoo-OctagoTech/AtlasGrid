import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#080b11",
        surface: {
          DEFAULT: "#0f1624",
          subtle: "#141e30",
          card: "rgba(15, 22, 36, 0.85)",
          border: "rgba(255, 255, 255, 0.08)",
          hover: "rgba(255, 255, 255, 0.05)",
        },
        fuel: {
          nuclear: "#a855f7",    // Purple
          hydro: "#3b82f6",      // Blue
          gas: "#f97316",        // Orange
          coal: "#64748b",       // Slate/Dark Grey
          solar: "#eab308",      // Yellow
          wind: "#06b6d4",       // Cyan
          storage: "#22c55e",    // Emerald Green
          geothermal: "#10b981", // Green/Teal
          biomass: "#d97706",    // Amber
          oil: "#ef4444",        // Red
          other: "#8b5cf6"
        },
        grid: {
          accent: "#38bdf8",
          spike: "#ef4444",
          negative: "#10b981",
          warning: "#f59e0b",
          normal: "#3b82f6"
        }
      },
      fontFamily: {
        mono: [
          "JetBrains Mono",
          "Fira Code",
          "SF Mono",
          "Consolas",
          "Menlo",
          "monospace",
        ],
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      boxShadow: {
        glow: "0 0 20px rgba(56, 189, 248, 0.35)",
        "glow-sm": "0 0 10px rgba(56, 189, 248, 0.25)",
        "glow-purple": "0 0 20px rgba(168, 85, 247, 0.4)",
        "glow-orange": "0 0 20px rgba(249, 115, 22, 0.4)",
        "glow-yellow": "0 0 20px rgba(234, 179, 8, 0.4)",
        "glow-cyan": "0 0 20px rgba(6, 182, 212, 0.4)",
        "glow-red": "0 0 20px rgba(239, 68, 68, 0.5)",
      },
      animation: {
        pulse_slow: "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        radar: "radar 4s linear infinite",
      },
      keyframes: {
        radar: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
