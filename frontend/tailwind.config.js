/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#0a1628",
          900: "#0f1f38",
          800: "#16294a",
          700: "#1e3a5f",
          600: "#28527d",
        },
        amber: {
          500: "#f59e0b",
          600: "#d97706",
        },
      },
    },
  },
  plugins: [],
};
