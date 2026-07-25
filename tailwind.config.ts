import type { Config } from "tailwindcss";

// Colors are driven by CSS custom properties so the whole UI re-themes live
// from user preferences (light/dark, accent color, etc.). See globals.css.
const config: Config = {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        fg: "var(--fg)",
        muted: "var(--muted)",
        border: "var(--border)",
        accent: "var(--accent)",
        "accent-soft": "var(--accent-soft)",
        "accent-contrast": "var(--accent-contrast)",
      },
      borderColor: {
        DEFAULT: "var(--border)",
      },
      borderRadius: {
        app: "var(--radius)",
      },
      fontFamily: {
        app: "var(--font)",
      },
    },
  },
  plugins: [],
};

export default config;
