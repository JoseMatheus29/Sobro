/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3161B2',
          light: '#4A74BB',
          lighter: '#7998CD',
          dark: '#254E8F',
        },
        surface: {
          DEFAULT: '#EBF1F6',
          dark: '#D4E1EF',
        },
        canvas: '#F7F9FC',
        ink: '#1A2B4A',
        muted: '#718096',
        subtle: '#A0AEC0',
        line: '#EDF1F6',
        income: '#36A83A',
        expense: '#A83636',
      },
    },
  },
  plugins: [],
};

