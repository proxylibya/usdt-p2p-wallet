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
        // Same theme as mobile app
        'background': {
          'primary': '#0B0E11',
          'secondary': '#1E2329',
          'tertiary': '#2B3139',
        },
        'text': {
          'primary': '#EAECEF',
          'secondary': '#848E9C',
          'disabled': '#5E6673',
        },
        'brand': {
          'yellow': '#F0B90B',
          'gold': '#F0B90B',
        },
        'status': {
          'success': '#0ECB81',
          'error': '#F6465D',
          'warning': '#F0B90B',
          'info': '#1E88E5',
        },
        'border': {
          'divider': '#2B3139',
        },
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      // Professional Animation System - Binance Style
      keyframes: {
        // Fade animations
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-down': {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-left': {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'fade-in-right': {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        // Scale animations
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'scale-out': {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(0.9)' },
        },
        'scale-in-center': {
          '0%': { opacity: '0', transform: 'scale(0.5)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.8)' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        // Slide animations
        'slide-in-left': {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-in-up': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-in-down': {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-out-left': {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(-100%)', opacity: '0' },
        },
        'slide-out-right': {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0' },
        },
        // Bounce animations
        'bounce-in': {
          '0%': { opacity: '0', transform: 'scale(0.3)' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'bounce-soft': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        // Pulse animations
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.95)', boxShadow: '0 0 0 0 rgba(240, 185, 11, 0.7)' },
          '70%': { transform: 'scale(1)', boxShadow: '0 0 0 10px rgba(240, 185, 11, 0)' },
          '100%': { transform: 'scale(0.95)', boxShadow: '0 0 0 0 rgba(240, 185, 11, 0)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(240, 185, 11, 0.5)' },
          '50%': { boxShadow: '0 0 20px rgba(240, 185, 11, 0.8)' },
        },
        // Shake animations
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' },
        },
        'shake-soft': {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-2px)' },
          '75%': { transform: 'translateX(2px)' },
        },
        // Spin animations
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'spin-reverse': {
          '0%': { transform: 'rotate(360deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
        // Float animations
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'float-soft': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        // Glow animations
        'glow': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(240, 185, 11, 0.2)' },
          '50%': { boxShadow: '0 0 20px rgba(240, 185, 11, 0.6)' },
        },
        'glow-success': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(14, 203, 129, 0.2)' },
          '50%': { boxShadow: '0 0 20px rgba(14, 203, 129, 0.6)' },
        },
        'glow-error': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(246, 70, 93, 0.2)' },
          '50%': { boxShadow: '0 0 20px rgba(246, 70, 93, 0.6)' },
        },
        // Skeleton loading
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'skeleton': {
          '0%': { opacity: '0.5' },
          '50%': { opacity: '1' },
          '100%': { opacity: '0.5' },
        },
        // Progress animations
        'progress-bar': {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
        'progress-indeterminate': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(400%)' },
        },
        // Flip animations
        'flip-in-x': {
          '0%': { transform: 'perspective(400px) rotateX(90deg)', opacity: '0' },
          '40%': { transform: 'perspective(400px) rotateX(-10deg)' },
          '70%': { transform: 'perspective(400px) rotateX(10deg)' },
          '100%': { transform: 'perspective(400px) rotateX(0deg)', opacity: '1' },
        },
        'flip-in-y': {
          '0%': { transform: 'perspective(400px) rotateY(90deg)', opacity: '0' },
          '40%': { transform: 'perspective(400px) rotateY(-10deg)' },
          '70%': { transform: 'perspective(400px) rotateY(10deg)' },
          '100%': { transform: 'perspective(400px) rotateY(0deg)', opacity: '1' },
        },
        // Counter/Number animations
        'count-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // Highlight animations
        'highlight': {
          '0%': { backgroundColor: 'rgba(240, 185, 11, 0)' },
          '50%': { backgroundColor: 'rgba(240, 185, 11, 0.2)' },
          '100%': { backgroundColor: 'rgba(240, 185, 11, 0)' },
        },
        // Row highlight
        'row-enter': {
          '0%': { backgroundColor: 'rgba(240, 185, 11, 0.3)', opacity: '0' },
          '100%': { backgroundColor: 'transparent', opacity: '1' },
        },
        // Modal/Dialog animations
        'modal-in': {
          '0%': { opacity: '0', transform: 'scale(0.95) translateY(-10px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        'modal-out': {
          '0%': { opacity: '1', transform: 'scale(1) translateY(0)' },
          '100%': { opacity: '0', transform: 'scale(0.95) translateY(-10px)' },
        },
        'backdrop-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        // Drawer animations
        'drawer-left': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'drawer-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        // Toast notifications
        'toast-in': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'toast-out': {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0' },
        },
        // Stagger effect helper
        'stagger-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // Ripple effect
        'ripple': {
          '0%': { transform: 'scale(0)', opacity: '0.5' },
          '100%': { transform: 'scale(4)', opacity: '0' },
        },
        // Card hover effect
        'card-hover': {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-4px)' },
        },
        // Typing cursor
        'blink': {
          '0%, 50%': { opacity: '1' },
          '51%, 100%': { opacity: '0' },
        },
      },
      animation: {
        // Fade
        'fade-in': 'fade-in 0.3s ease-out forwards',
        'fade-out': 'fade-out 0.3s ease-out forwards',
        'fade-in-fast': 'fade-in 0.15s ease-out forwards',
        'fade-in-slow': 'fade-in 0.5s ease-out forwards',
        'fade-in-up': 'fade-in-up 0.4s ease-out forwards',
        'fade-in-down': 'fade-in-down 0.4s ease-out forwards',
        'fade-in-left': 'fade-in-left 0.4s ease-out forwards',
        'fade-in-right': 'fade-in-right 0.4s ease-out forwards',
        // Scale
        'scale-in': 'scale-in 0.3s ease-out forwards',
        'scale-out': 'scale-out 0.3s ease-out forwards',
        'scale-in-center': 'scale-in-center 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'pop-in': 'pop-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        // Slide
        'slide-in-left': 'slide-in-left 0.4s ease-out forwards',
        'slide-in-right': 'slide-in-right 0.4s ease-out forwards',
        'slide-in-up': 'slide-in-up 0.4s ease-out forwards',
        'slide-in-down': 'slide-in-down 0.4s ease-out forwards',
        'slide-out-left': 'slide-out-left 0.3s ease-in forwards',
        'slide-out-right': 'slide-out-right 0.3s ease-in forwards',
        // Bounce
        'bounce-in': 'bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards',
        'bounce-soft': 'bounce-soft 2s ease-in-out infinite',
        // Pulse
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        // Shake
        'shake': 'shake 0.5s ease-in-out',
        'shake-soft': 'shake-soft 0.3s ease-in-out',
        // Spin
        'spin-slow': 'spin-slow 3s linear infinite',
        'spin-reverse': 'spin-reverse 1s linear infinite',
        // Float
        'float': 'float 3s ease-in-out infinite',
        'float-soft': 'float-soft 2s ease-in-out infinite',
        // Glow
        'glow': 'glow 2s ease-in-out infinite',
        'glow-success': 'glow-success 2s ease-in-out infinite',
        'glow-error': 'glow-error 2s ease-in-out infinite',
        // Skeleton/Shimmer
        'shimmer': 'shimmer 2s linear infinite',
        'skeleton': 'skeleton 1.5s ease-in-out infinite',
        // Progress
        'progress-bar': 'progress-bar 2s ease-out forwards',
        'progress-indeterminate': 'progress-indeterminate 1.5s ease-in-out infinite',
        // Flip
        'flip-in-x': 'flip-in-x 0.6s ease-out forwards',
        'flip-in-y': 'flip-in-y 0.6s ease-out forwards',
        // Counter
        'count-up': 'count-up 0.5s ease-out forwards',
        // Highlight
        'highlight': 'highlight 1.5s ease-in-out',
        'row-enter': 'row-enter 0.5s ease-out forwards',
        // Modal
        'modal-in': 'modal-in 0.3s ease-out forwards',
        'modal-out': 'modal-out 0.2s ease-in forwards',
        'backdrop-in': 'backdrop-in 0.3s ease-out forwards',
        // Drawer
        'drawer-left': 'drawer-left 0.3s ease-out forwards',
        'drawer-right': 'drawer-right 0.3s ease-out forwards',
        // Toast
        'toast-in': 'toast-in 0.4s ease-out forwards',
        'toast-out': 'toast-out 0.3s ease-in forwards',
        // Stagger
        'stagger-in': 'stagger-in 0.4s ease-out forwards',
        // Ripple
        'ripple': 'ripple 0.6s linear forwards',
        // Card
        'card-hover': 'card-hover 0.2s ease-out forwards',
        // Blink
        'blink': 'blink 1s step-end infinite',
      },
      // Animation delays for staggered effects
      transitionDelay: {
        '0': '0ms',
        '75': '75ms',
        '100': '100ms',
        '150': '150ms',
        '200': '200ms',
        '250': '250ms',
        '300': '300ms',
        '400': '400ms',
        '500': '500ms',
        '600': '600ms',
        '700': '700ms',
        '800': '800ms',
        '900': '900ms',
        '1000': '1000ms',
      },
    },
  },
  plugins: [],
};
