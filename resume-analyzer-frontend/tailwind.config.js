/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Backgrounds
        'deep-navy': '#0f172a',    // Main dark bg
        'rich-black': '#020617',   // Darker shade for contrast
        'glass-black': 'rgba(15, 23, 42, 0.6)',

        // Primary Theme Colors (Consistent across all pages)
        'electric-violet': '#7c3aed', // Primary Brand Color
        'bright-teal': '#06b6d4',     // Primary Action Color
        'soft-violet': '#a78bfa',     // Secondary Purple
        'neon-pink': '#f43f5e',       // Highlights
        'accent-yellow': '#fbbf24',   // Warnings/Stars
        'eco-green': '#10b981',       // Success/Active

        // Text Colors
        'charcoal': '#1f2937',        // Dark text
        'lavender-gray': '#e2e8f0',   // Light text
        'muted-gray': '#94a3b8',      // Secondary text

        // Legacy (keep for compatibility)
        'slate-blue': '#334155',
      },
      fontFamily: {
        'sans': ['Inter', 'Plus Jakarta Sans', 'sans-serif'],
        'heading': ['Outfit', 'Inter', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-gradient': 'linear-gradient(to right bottom, #0f172a, #1e1b4b, #312e81)',
        'card-gradient': 'linear-gradient(145deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.6))',
        'glow-conic': 'conic-gradient(from 180deg at 50% 50%, #2a8af6 0deg, #a853ba 180deg, #2a8af6 360deg)',
      },
      boxShadow: {
        'neon': '0 0 5px theme("colors.electric-violet"), 0 0 20px theme("colors.electric-violet")',
        'neon-teal': '0 0 5px theme("colors.bright-teal"), 0 0 20px theme("colors.bright-teal")',
        'glass': '0 4px 30px rgba(0, 0, 0, 0.1)',
        'glass-hover': '0 10px 40px rgba(0, 0, 0, 0.2)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-right': 'slideInRight 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'spin-slow': 'spin 12s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1', filter: 'brightness(1)' },
          '50%': { opacity: '0.8', filter: 'brightness(1.5)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        }
      },
    },
  },
  plugins: [],
}
