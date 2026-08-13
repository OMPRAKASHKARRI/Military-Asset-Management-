/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#0a0e17",
          900: "#0f1420",
          850: "#131a2a",
          800: "#182236",
          700: "#212e46",
          600: "#2b3a58",
          500: "#3a4d70",
        },
        accent: {
          DEFAULT: "#3b82f6",
          light: "#60a5fa",
          amber: "#d4a54c",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
