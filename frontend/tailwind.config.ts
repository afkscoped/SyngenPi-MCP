import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                bg: "#F9F6F2", // Very pale cream/linen
                card: "#FFFFFF",
                accent: "#D3B683", // The User's "Very Light Brown"
                accent2: "#8C7B5D", // Darker shade of accent for hover/active
                text: "#2C2A26", // Dark warm charcoal for high contrast
                muted: "#6B665E", // Warm gray
                border: "#E0DDD5", // Warm border
                success: "#4A7A5E", // Muted natural green
                danger: "#B84A4A", // Muted brick red
            },
            boxShadow: {
                soft: "0 2px 10px rgba(44, 42, 38, 0.04)", // Very subtle warm shadow
                medium: "0 8px 30px rgba(44, 42, 38, 0.08)",
            },
            borderRadius: {
                xl: "8px", // Sharper, more professional corners
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'], // Body
                display: ['Playfair Display', 'Merriweather', 'serif'], // Headers - Professional/Journal vibe
            },
        },
    },
    plugins: [],
};
export default config;
