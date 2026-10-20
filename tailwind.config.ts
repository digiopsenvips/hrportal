import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        enactus: {
          yellow: "#FFC220",
          yellowHover: "#E6AB10",
          dark: "#121826",
          navy: "#0F172A",
          accent: "#2563EB",
          card: "#1E293B",
        },
      },
    },
  },
  plugins: [],
};
export default config;
