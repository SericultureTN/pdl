/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        emerald: {
          primary: '#0B5D3B',
          secondary: '#113D2C',
          light: '#0F7A4D',
          muted: '#E8F5EF',
        },
        gold: {
          accent: '#D4AF37',
          light: '#F5E6A3',
          muted: '#FBF6E8',
        },
        surface: {
          bg: '#F8FAFC',
          card: 'rgba(255, 255, 255, 0.92)',
          border: 'rgba(11, 93, 59, 0.08)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        luxury: '24px',
        'luxury-sm': '20px',
        'luxury-lg': '28px',
      },
      boxShadow: {
        luxury: '0 4px 24px rgba(11, 93, 59, 0.08)',
        'luxury-lg': '0 12px 40px rgba(11, 93, 59, 0.12)',
        'luxury-hover': '0 20px 48px rgba(11, 93, 59, 0.14)',
        glass: '0 8px 32px rgba(17, 61, 44, 0.06)',
        navbar: '0 1px 0 rgba(11, 93, 59, 0.06), 0 4px 24px rgba(11, 93, 59, 0.04)',
      },
      backdropBlur: {
        glass: '20px',
      },
      animation: {
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.35s ease-out',
        'lift': 'lift 0.3s ease-out',
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 0 0 rgba(16, 185, 129, 0.4)' },
          '50%': { opacity: '0.85', boxShadow: '0 0 0 8px rgba(16, 185, 129, 0)' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'lift': {
          from: { transform: 'translateY(0)' },
          to: { transform: 'translateY(-4px)' },
        },
      },
    },
  },
  plugins: [],
}
