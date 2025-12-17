/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./App.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg: "#e8f5e9",
        primary: "#4CAF50",
        "primary-foreground": "#2e5a2e",
        secondary: "#151312",
        light: {
          100: "#D6C7FF",
          200: "#A8B5DB",
          300: "#9CA4AB",
        },
        dark: {
          100: "#221F3D",
          200: "#0F0D23",
        },
        accent: "#4CAF50",
        muted: "#767676",
        input: "#f4faf5",
        card: "#f1f8f2",
        border: "#c8e6c9",
      }
    }
  },
  plugins: [],
};