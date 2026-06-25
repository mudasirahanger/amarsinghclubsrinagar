/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        headline: ["NotoSerif_700Bold"],
        body: ["Inter_400Regular"],
        label: ["Inter_600SemiBold"],
        display: ["NotoSerif_700Bold"],
      },
      colors: {
        background: "#fff8f2",
        primary: "#001715",
        "primary-container": "#132c2a",
        secondary: "#8d4b4b",
        tertiary: "#735c00",
        "surface-container-low": "#fcf2e6",
        "surface-container-high": "#f1e7db",
        "surface-container-highest": "#ebe1d5",
        "surface-container-lowest": "#fff8f2",
        "outline-variant": "#c1c8c6",
        "on-surface-variant": "#414847",
        "on-primary-container": "#7a9491",
        outline: "#727877",
      },
    },
  },
  plugins: [],
}