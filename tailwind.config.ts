import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./content/**/*.{md,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#FAFAF8",
        surface: "#FFFFFF",
        "surface-alt": "#F5F3EF",
        border: "#E8E4DD",
        "border-light": "#F0EDE7",
        text: "#1A1A18",
        "text-body": "#3D3D3A",
        "text-muted": "#8A8780",
        "text-dim": "#B0ADA6",
        accent: "#E8590C",
        "accent-dark": "#C24B0A",
        "accent-soft": "#FFF1EB",
        green: "#2B8A3E",
        "green-soft": "#EBFBEE",
        blue: "#1971C2",
        "blue-soft": "#E7F5FF",
        purple: "#7048C6",
        "purple-soft": "#F3F0FF",
        dark: "#1A1A18",
        "dark-soft": "#2C2C29",
      },
      fontFamily: {
        serif: ["var(--font-instrument-serif)", "Georgia", "serif"],
        mono: ["var(--font-ibm-plex-mono)", "Menlo", "monospace"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      maxWidth: {
        content: "800px",
      },
    },
  },
  plugins: [],
};

export default config;
