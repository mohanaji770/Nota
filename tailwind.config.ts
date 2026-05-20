import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "#fafaf6",
        "surface-dark": "#111110",
        accent: "#ff9f0a",
        positive: "#2f8f56",
        destructive: "#ef4444",
      },
      fontFamily: {
        sans: ["Cairo", "Tahoma", "Arial", "sans-serif"]
      },
      boxShadow: {
        soft: "0 2px 16px rgba(0,0,0,0.06)",
        card: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)",
        fab: "0 8px 24px rgba(47,143,86,0.28)",
      },
      transitionTimingFunction: {
        material: "cubic-bezier(0.4, 0, 0.2, 1)"
      }
    }
  },
  plugins: []
};

export default config;
