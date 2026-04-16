import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        farol: {
          luz: "#FCE382",
          turquesa: "#86C9CD",
          coral: "#DF8B82",
          noite: "#2A2A2A",
          nevoa: "#DFE0E5",
        },
      },
    },
  },
  plugins: [],
};

export default config;
