/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        dark: {
          bg: '#000000',
          card: 'rgba(255, 255, 255, 0.03)',
          glass: 'rgba(255, 255, 255, 0.05)',
        }
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #4b5563 0%, #1f2937 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #6b7280 0%, #374151 100%)',
        'gradient-success': 'linear-gradient(135deg, #4b5563 0%, #1f2937 100%)',
        'gradient-purple-pink': 'linear-gradient(135deg, #4b5563 0%, #1f2937 100%)',
        'gradient-blue-cyan': 'linear-gradient(135deg, #6b7280 0%, #374151 100%)',
        'gradient-green-emerald': 'linear-gradient(135deg, #4b5563 0%, #1f2937 100%)',
        'gradient-orange-red': 'linear-gradient(135deg, #6b7280 0%, #374151 100%)',
        'gradient-gray-gray': 'linear-gradient(135deg, #4b5563 0%, #1f2937 100%)',
      },
      boxShadow: {
        'glow': '0 10px 40px rgba(0, 0, 0, 0.5)',
        'glow-purple': '0 0 20px rgba(255, 255, 255, 0.1)',
        'glow-purple-strong': '0 0 40px rgba(255, 255, 255, 0.15)',
      },
      animation: {
        'blob': 'blob 7s infinite',
        'float': 'float 3s ease-in-out infinite',
        'float-slow': 'float-slow 6s ease-in-out infinite',
        'gradient': 'gradient 8s ease infinite',
        'gradient-shift': 'gradient-shift 3s ease infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-30px)' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'gradient-shift': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          }
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(168, 85, 247, 0.5)' },
          '50%': { boxShadow: '0 0 40px rgba(168, 85, 247, 0.8)' },
        }
      },
      backdropBlur: {
        'xs': '2px',
        'lg': '16px',
        'xl': '24px',
      }
    },
  },
  plugins: [],
}