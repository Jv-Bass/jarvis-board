/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        jarvis: {
          bg: '#0a0a0f',
          panel: '#12121a',
          cyan: '#00d4ff',
          orange: '#ff6b00',
          green: '#00ff88',
          pink: '#ff3366',
          border: '#2a2a3a',
          text: '#ffffff',
          muted: '#8888aa',
        },
      },
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        rajdhani: ['Rajdhani', 'sans-serif'],
      },
      boxShadow: {
        'jarvis': '0 4px 20px rgba(0, 212, 255, 0.1)',
        'jarvis-hover': '0 8px 30px rgba(0, 212, 255, 0.2)',
        'jarvis-glow': '0 0 20px rgba(0, 212, 255, 0.4)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'fade-in': 'fade-in 0.3s ease-out',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(0, 212, 255, 0.3)' },
          '50%': { boxShadow: '0 0 25px rgba(0, 212, 255, 0.6)' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
