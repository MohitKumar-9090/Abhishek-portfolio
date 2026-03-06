/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        heading: ["Sora", "sans-serif"],
        body: ["Space Grotesk", "sans-serif"]
      },
      colors: {
        night: "#050816",
        card: "#0f172a",
        accent: "#22d3ee",
        glow: "#a855f7",
        punch: "#ec4899"
      },
      boxShadow: {
        neon: "0 20px 48px rgba(168, 85, 247, 0.28)"
      },
      backgroundImage: {
        "hero-grid":
          "radial-gradient(circle at 18% 14%, rgba(34,211,238,0.22) 0, transparent 35%), radial-gradient(circle at 78% 12%, rgba(168,85,247,0.28) 0, transparent 36%), radial-gradient(circle at 70% 82%, rgba(236,72,153,0.20) 0, transparent 34%)"
      }
    }
  },
  plugins: []
};
