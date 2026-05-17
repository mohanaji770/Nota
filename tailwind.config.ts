import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f7f7f5",
          100: "#ecebe6",
          500: "#76736b",
          700: "#34322e",
          900: "#171613"
        },
        leaf: {
          50: "#eef8f1",
          100: "#d7f0df",
          500: "#2f8f56",
          600: "#257244",
          700: "#1f5c39"
        },
        amber: {
          100: "#fff2cc",
          400: "#eab308",
          500: "#c78a04"
        }
      },
      fontFamily: {
        sans: ["Cairo", "Tahoma", "Arial", "sans-serif"]
      },
      boxShadow: {
        soft: "0 18px 45px rgba(15, 23, 42, 0.08)",
        fab: "0 16px 32px rgba(37, 114, 68, 0.36)"
      },
      transitionTimingFunction: {
        material: "cubic-bezier(0.4, 0, 0.2, 1)"
      }
    }
  },
  plugins: []
};

export default config;
