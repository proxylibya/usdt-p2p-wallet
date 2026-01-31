/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  safelist: [
    // ===== BRAND YELLOW (used as primaryColor = 'brand-yellow') =====
    'text-brand-yellow', 'bg-brand-yellow', 'border-brand-yellow', 'ring-brand-yellow', 'shadow-brand-yellow',
    'bg-brand-yellow/5', 'bg-brand-yellow/10', 'bg-brand-yellow/20', 'bg-brand-yellow/30', 'bg-brand-yellow/50',
    'text-brand-yellow/50', 'border-brand-yellow/20', 'border-brand-yellow/50',
    'ring-brand-yellow/20', 'ring-brand-yellow/50', 'shadow-brand-yellow/20', 'shadow-brand-yellow/30',
    'hover:text-brand-yellow', 'hover:bg-brand-yellow', 'hover:border-brand-yellow',
    'focus:ring-brand-yellow', 'focus:border-brand-yellow',
    
    // ===== BRAND GREEN (used as primaryColor = 'brand-green') =====
    'text-brand-green', 'bg-brand-green', 'border-brand-green', 'ring-brand-green', 'shadow-brand-green',
    'bg-brand-green/5', 'bg-brand-green/10', 'bg-brand-green/20', 'bg-brand-green/30', 'bg-brand-green/50',
    'text-brand-green/50', 'border-brand-green/20', 'border-brand-green/50',
    'ring-brand-green/20', 'ring-brand-green/50', 'shadow-brand-green/20', 'shadow-brand-green/30',
    'hover:text-brand-green', 'hover:bg-brand-green', 'hover:border-brand-green',
    'focus:ring-brand-green', 'focus:border-brand-green',
    
    // ===== PRIMARY GOLD (alias theme colors) =====
    'text-primary-gold', 'bg-primary-gold', 'border-primary-gold', 'ring-primary-gold', 'shadow-primary-gold',
    'bg-primary-gold-10', 'bg-primary-gold-20', 'bg-primary-green-10', 'bg-primary-green-20',
    'bg-primary-gold/10', 'bg-primary-gold/20', 'bg-primary-gold/50',
    'border-primary-gold/20', 'border-primary-gold/50', 'ring-primary-gold/20', 'ring-primary-gold/50',
    'shadow-primary-gold/20', 'hover:text-primary-gold', 'hover:border-primary-gold',
    
    // ===== PRIMARY GREEN (alias theme colors) =====
    'text-primary-green', 'bg-primary-green', 'border-primary-green', 'ring-primary-green', 'shadow-primary-green',
    'bg-primary-green/10', 'bg-primary-green/20', 'bg-primary-green/50',
    'border-primary-green/20', 'border-primary-green/50', 'ring-primary-green/20', 'ring-primary-green/50',
    'shadow-primary-green/20', 'hover:text-primary-green', 'hover:border-primary-green',
    
    // ===== STATUS COLORS =====
    'text-success', 'bg-success', 'border-success', 'ring-success',
    'bg-success/10', 'bg-success/20', 'border-success/20', 'text-success/50',
    'text-error', 'bg-error', 'border-error', 'ring-error',
    'bg-error/10', 'bg-error/20', 'border-error/20', 'text-error/50',
    
    // ===== GRADIENTS =====
    'from-brand-yellow', 'to-brand-yellow', 'via-brand-yellow',
    'from-brand-green', 'to-brand-green', 'via-brand-green',
    'from-brand-yellow/20', 'from-brand-yellow/50', 'to-brand-yellow/10',
    'from-brand-green/20', 'from-brand-green/50', 'to-brand-green/10',
  ],
  theme: {
    extend: {
      colors: {
        'background-primary': '#0B0E11',
        'background-secondary': '#1E2026',
        'background-tertiary': '#2B3139',
        'brand-yellow': '#F0B90B',
        'brand-green': '#0ECB81',
        'success': '#0ECB81',
        'error': '#F6465D',
        'text-primary': '#FEFEFE',
        'text-secondary': '#848E9C',
        'border-divider': '#2B3139',
        // Primary theme colors with opacity variants
        'primary-gold': '#F0B90B',
        'primary-gold-10': 'rgba(240, 185, 11, 0.1)',
        'primary-gold-20': 'rgba(240, 185, 11, 0.2)',
        'primary-green': '#0ECB81',
        'primary-green-10': 'rgba(14, 203, 129, 0.1)',
        'primary-green-20': 'rgba(14, 203, 129, 0.2)',
      },
      fontFamily: {
        arabic: ['Cairo', 'Tajawal', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'fadeIn': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-slow': 'pulse 3s infinite',
        'scale-in': 'scaleIn 0.2s ease-out',
        'marquee': 'marquee 30s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
}
