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
        teamhub: {
          bg: "#F7F9F7",
          card: "#FFFFFF",
          primary: "#2FC3A5",
          primaryHover: "#26B396",
          highlight: "#E7F3D7",
          hover: "#DDF7EF",
          border: "#E3EBE7",
          text: "#263832",
          muted: "#60736C",
          teal: "#0D5143",
        },
        enactus: {
          gold: "#FFC220",
          goldHover: "#E6AB10",
        },
      },
    },
  },
  plugins: [],
};
export default config;
