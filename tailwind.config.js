const { tailwindColors } = require('./constants/palette');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // Every token is a CSS variable: ThemeProvider sets its value for the light or the dark scheme.
      colors: tailwindColors(),
    },
  },
  plugins: [],
};
