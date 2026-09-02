import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        zinc: {
          950: "#09090b",
          900: "#18181b",
          850: "#202024",
          800: "#27272a",
          700: "#3f3f46",
          600: "#52525b",
          500: "#71717a",
          400: "#a1a1aa",
          300: "#d4d4d8",
          200: "#e4e4e7",
          100: "#f4f4f5",
          50: "#fafafa",
        },
        brand: {
          50: "#f0f7ff",
          100: "#e0effe",
          200: "#bae0fd",
          300: "#7cc5fb",
          400: "#36a7f7",
          500: "#0c8ce9",
          600: "#026fc7",
          700: "#0358a1",
          800: "#074b84",
          900: "#0c3f6e",
          950: "#082849",
        },
        construction: {
          amber: "#f97316",
          orange: "#ea580c",
          steel: "#0284c7",
          emerald: "#10b981",
          slate: "#334155",
          charcoal: "#1e293b",
        },
        status: {
          healthy: "#10b981",
          risk: "#f59e0b",
          critical: "#ef4444",
          draft: "#64748b",
          completed: "#3b82f6",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          '"Plus Jakarta Sans"',
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "sans-serif",
        ],
        display: [
          '"Plus Jakarta Sans"',
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
        mono: [
          '"JetBrains Mono"',
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05), 0 0 0 1px rgb(0 0 0 / 0.03)",
        "card-hover": "0 10px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.04), 0 0 0 1px rgb(0 0 0 / 0.05)",
        elevated: "0 12px 30px -6px rgb(0 0 0 / 0.12), 0 8px 12px -6px rgb(0 0 0 / 0.06)",
        dropdown: "0 14px 34px -4px rgb(0 0 0 / 0.15), 0 4px 8px -2px rgb(0 0 0 / 0.06)",
        modal: "0 24px 48px -12px rgb(0 0 0 / 0.25), 0 10px 20px -8px rgb(0 0 0 / 0.12)",
        drawer: "-8px 0 32px 0 rgb(0 0 0 / 0.18)",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        slideInRight: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        slideOutRight: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(100%)" },
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "slide-in-right": "slideInRight 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slide-out-right": "slideOutRight 250ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-in": "fadeIn 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "scale-in": "scaleIn 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
        shimmer: "shimmer 2s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
