import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./content/**/*.{md,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: "var(--color-bg)",
        "bg-alpha": "var(--color-bg-alpha)",
        surface: "var(--color-surface)",
        "surface-alt": "var(--color-surface-alt)",
        border: "var(--color-border)",
        "border-light": "var(--color-border-light)",
        text: "var(--color-text)",
        "text-body": "var(--color-text-body)",
        "text-muted": "var(--color-text-muted)",
        "text-dim": "var(--color-text-dim)",
        accent: "var(--color-accent)",
        "accent-dark": "var(--color-accent-dark)",
        "accent-soft": "var(--color-accent-soft)",
        green: "var(--color-green)",
        "green-soft": "var(--color-green-soft)",
        blue: "var(--color-blue)",
        "blue-soft": "var(--color-blue-soft)",
        purple: "var(--color-purple)",
        "purple-soft": "var(--color-purple-soft)",
        dark: "var(--color-dark)",
        "dark-soft": "var(--color-dark-soft)",
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
