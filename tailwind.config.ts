import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Background colors
        bg: {
          primary: "var(--bg-primary)",
          secondary: "var(--bg-secondary)",
          tertiary: "var(--bg-tertiary)",
        },
        // Border colors
        border: {
          DEFAULT: "var(--border-default)",
          focus: "var(--border-focus)",
        },
        // Text colors
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
        },
        // Semantic colors
        deposit: {
          DEFAULT: "var(--deposit-green)",
          bg: "var(--deposit-green-bg)",
        },
        withdraw: {
          DEFAULT: "var(--withdraw-red)",
          bg: "var(--withdraw-red-bg)",
        },
        warning: {
          DEFAULT: "var(--warning-amber)",
          bg: "var(--warning-amber-bg)",
        },
        holding: {
          DEFAULT: "var(--holding-blue)",
          bg: "var(--holding-blue-bg)",
        },
        paying: {
          DEFAULT: "var(--paying-purple)",
          bg: "var(--paying-purple-bg)",
        },
        platform: {
          DEFAULT: "var(--platform-teal)",
          bg: "var(--platform-teal-bg)",
        },
        inactive: "var(--inactive-gray)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1" }],
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
      },
      borderRadius: {
        lg: "12px",
        md: "8px",
      },
    },
  },
  plugins: [],
};

export default config;
