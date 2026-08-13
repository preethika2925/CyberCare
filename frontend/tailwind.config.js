/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cyber: {
          navy: '#0a192f',
          darkBlue: '#1e293b',
          electric: '#0066ff',
          crimson: '#ff2a5f',
          purple: '#8b5cf6',
          gradientStart: '#1d4ed8',
          gradientMid: '#8b5cf6',
          gradientEnd: '#ff2a5f',
          bgLight: '#f8fafc',
          cardBorder: '#e2e8f0',
        }
      },
      backgroundImage: {
        'cyber-gradient': 'linear-gradient(135deg, #1e40af 0%, #7e22ce 50%, #e11d48 100%)',
        'cyber-glow': 'radial-gradient(circle at center, rgba(0, 102, 255, 0.15) 0%, rgba(255, 42, 95, 0.05) 50%, transparent 100%)',
        'glass-card': 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.85) 100%)'
      },
      boxShadow: {
        'glow-blue': '0 0 20px -3px rgba(0, 102, 255, 0.35)',
        'glow-crimson': '0 0 20px -3px rgba(255, 42, 95, 0.4)',
        'glass': '0 10px 30px -5px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(226, 232, 240, 0.8)'
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'shield-glow': 'shieldGlow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shieldGlow: {
          '0%': { filter: 'drop-shadow(0 0 8px rgba(0, 102, 255, 0.5))' },
          '100%': { filter: 'drop-shadow(0 0 18px rgba(255, 42, 95, 0.8))' },
        }
      }
    },
  },
  plugins: [],
};
