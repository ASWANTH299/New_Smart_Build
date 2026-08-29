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
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        elevated: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
      },
    },
  },
  plugins: [],
};

export default config;

