/** @type {import('tailwindcss').Config} */

import { TOKENS } from "./config/theme/tokens";
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
        ...TOKENS
      },

      borderRadius: {
        sm: 6,
        md: 8,
        lg: 12,
        xl: 16,
      },

      // Android-first semantic shadows
      boxShadow: {
        sm: "0px 1px 2px rgba(0,0,0,0.05)",
        md: "0px 2px 4px rgba(0,0,0,0.08)",
        lg: "0px 4px 8px rgba(0,0,0,0.12)",
      },
    }
  },
  plugins: [],
};