import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        acorn: {
          50: "#faf6f0",
          100: "#f2e8d9",
          200: "#e4ceb0",
          300: "#d4ae7f",
          400: "#c48f54",
          500: "#b3743a",
          600: "#985c30",
          700: "#7a462a",
          800: "#653a28",
          900: "#553124",
        },
      },
    },
  },
  plugins: [],
};

export default config;
