import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#005b7f",
          dark: "#00425d",
          light: "#eff8fc",
        },
      },
    },
  },
  plugins: [],
};
export default config;
