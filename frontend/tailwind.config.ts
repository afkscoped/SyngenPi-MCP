import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: 'class',
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./contexts/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                'neon-cyan': '#00f0ff',
                'neon-magenta': '#ff00ff',
                'neon-purple': '#b066ff',
                'neon-green': '#39ff14',
                'neon-blue': '#0080ff',
                'neon-pink': '#ff0080',

                accent: '#00f0ff',
                accent2: '#b066ff',
                accent3: '#ff00ff',

                success: '#39ff14',
                danger: '#ff0080',
                warning: '#ffaa00',
            },
            boxShadow: {
                'neon-cyan': '0 0 20px rgba(0, 240, 255, 0.5)',
                'neon-magenta': '0 0 20px rgba(255, 0, 255, 0.5)',
                'neon-purple': '0 0 20px rgba(176, 102, 255, 0.5)',
                'neon': '0 0 10px currentColor, 0 0 20px currentColor',
                'glow': '0 4px 30px rgba(0, 240, 255, 0.3)',
            },
            fontFamily: {
                sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
                display: ['var(--font-orbitron)', 'system-ui', 'sans-serif'],
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'glow': 'glow 2s ease-in-out infinite',
                'scan': 'scan 8s linear infinite',
            },
            keyframes: {
                glow: {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.5' },
                },
                scan: {
                    '0%': { transform: 'translateY(-100%)' },
                    '100%': { transform: 'translateY(100vh)' },
                }
            },
        },
    },
    plugins: [],
};
export default config;
