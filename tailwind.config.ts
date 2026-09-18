import type { Config } from "tailwindcss";

const colorNames = [
  "surface", "surface-dim", "surface-bright", "surface-container-lowest",
  "surface-container-low", "surface-container", "surface-container-high",
  "surface-container-highest", "on-surface", "on-surface-variant",
  "inverse-surface", "inverse-on-surface", "outline", "outline-variant",
  "surface-tint", "primary", "on-primary", "primary-container",
  "on-primary-container", "inverse-primary", "secondary", "on-secondary",
  "secondary-container", "on-secondary-container", "tertiary", "on-tertiary",
  "tertiary-container", "on-tertiary-container", "error", "on-error",
  "error-container", "on-error-container", "primary-fixed", "primary-fixed-dim",
  "on-primary-fixed", "on-primary-fixed-variant", "secondary-fixed",
  "secondary-fixed-dim", "on-secondary-fixed", "on-secondary-fixed-variant",
  "tertiary-fixed", "tertiary-fixed-dim", "on-tertiary-fixed",
  "on-tertiary-fixed-variant", "background", "on-background", "surface-variant",
];

const config: Config = {
  content: ["./components/**/*.{js,ts,jsx,tsx,mdx}", "./app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    borderRadius: { none: "0px", sm: "0px", DEFAULT: "0px", md: "0px", lg: "0px", xl: "0px", "2xl": "0px", "3xl": "0px", full: "0px" },
    extend: {
      colors: Object.fromEntries(colorNames.map((name) => [name, `rgb(var(--${name}) / <alpha-value>)`])),
      fontFamily: {
        headline: ["var(--font-cormorant)", "Georgia", "serif"],
        display: ["var(--font-cormorant)", "Georgia", "serif"],
        body: ["var(--font-jakarta)", "Arial", "sans-serif"],
        label: ["var(--font-jakarta)", "Arial", "sans-serif"],
        sans: ["var(--font-jakarta)", "Arial", "sans-serif"],
      },
      boxShadow: {
        "search-float": "0 2px 24px -4px rgba(27, 28, 26, 0.08)",
        "panel-float": "0 4px 32px -4px rgba(27, 28, 26, 0.12)",
        "nav-float": "0 8px 30px rgba(27, 28, 26, 0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
