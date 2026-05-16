/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#050816",
        surface: "rgba(15,23,42,0.72)",
        primary: "#7C3AED",
      },
    },
  },
  plugins: [],
}
