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
          amber: "#f59e0b",
          orange: "#ea580c",
          slate: "#334155",
          steel: "#475569",
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
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
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
        card: "0 1px 3px 0 rgb(15 23 42 / 0.07), 0 1px 2px -1px rgb(15 23 42 / 0.07), 0 0 0 1px rgb(15 23 42 / 0.03)",
        "card-hover": "0 10px 25px -5px rgb(15 23 42 / 0.1), 0 8px 10px -6px rgb(15 23 42 / 0.05), 0 0 0 1px rgb(15 23 42 / 0.05)",
        elevated: "0 12px 30px -6px rgb(15 23 42 / 0.12), 0 8px 12px -6px rgb(15 23 42 / 0.06)",
        dropdown: "0 14px 34px -4px rgb(15 23 42 / 0.14), 0 4px 8px -2px rgb(15 23 42 / 0.06)",
        modal: "0 24px 48px -12px rgb(15 23 42 / 0.25), 0 10px 20px -8px rgb(15 23 42 / 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;

