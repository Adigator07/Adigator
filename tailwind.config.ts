import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          violet: "#7c3aed",
          indigo: "#4f46e5",
          cyan: "#06b6d4",
        },
        studio: {
          bg: "var(--studio-bg)",
          "bg-soft": "var(--studio-bg-soft)",
          surface: "var(--studio-surface)",
          "surface-elevated": "var(--studio-surface-elevated)",
          border: "var(--studio-border)",
          accent: "var(--studio-accent)",
          "accent-secondary": "var(--studio-accent-secondary)",
          text: "var(--studio-text)",
          muted: "var(--studio-text-muted)",
          tertiary: "var(--studio-text-tertiary)",
          success: "var(--studio-success)",
          warning: "var(--studio-warning)",
          error: "var(--studio-error)",
        },
      },
      boxShadow: {
        studio: "var(--studio-shadow)",
        "studio-glow": "var(--studio-shadow-glow)",
      },
      transitionTimingFunction: {
        "expo-out": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "slide-up": "slideUp 0.4s ease-out forwards",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
