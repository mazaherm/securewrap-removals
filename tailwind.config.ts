import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eaf3ee",
          100: "#cbe1d4",
          200: "#a3cbb2",
          300: "#71b08b",
          400: "#3f8f64",
          500: "#1f7047",
          600: "#0f5c39",
          700: "#0b4a2f",
          800: "#0a3d27",
          900: "#082f1f",
          950: "#052018",
        },
        gold: {
          50: "#faf6ea",
          100: "#f2e8c8",
          200: "#e6d296",
          300: "#d8b962",
          400: "#c9a23c",
          500: "#b3882a",
          600: "#946c21",
          700: "#75521c",
        },
        ink: {
          50: "#f6f7f7",
          100: "#e8eae9",
          200: "#c9cecb",
          300: "#a3aba6",
          400: "#788279",
          500: "#5b645d",
          600: "#454d47",
          700: "#343a36",
          800: "#262b27",
          900: "#1a1d1b",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(10, 20, 15, 0.06), 0 1px 3px rgba(10, 20, 15, 0.08)",
        panel: "0 4px 16px rgba(10, 20, 15, 0.08)",
      },
      borderRadius: {
        card: "10px",
      },
    },
  },
  plugins: [],
};

export default config;
