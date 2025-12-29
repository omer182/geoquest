/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Enhanced dark-mode color palette inspired by modern geography apps
        // Base: Rich deep blues with subtle gradients
        'dark-bg': '#0a0e1a', // Deepest background - navy black
        'dark-base': '#111827', // Primary background - deep slate
        'dark-surface': '#1e293b', // Raised surfaces - slate-800
        'dark-elevated': '#2d3748', // Elevated cards - slate-700
        'dark-card': '#374151', // Card backgrounds - gray-700

        // Primary accent: Vibrant ocean blue for geography theme
        primary: {
          DEFAULT: '#3b82f6', // blue-500 - main interactive color
          dark: '#2563eb', // blue-600 - hover states
          light: '#60a5fa', // blue-400 - highlights
          glow: 'rgba(59, 130, 246, 0.5)', // glow effects
        },

        // Secondary accent: Warm coral for CTAs and success states
        secondary: {
          DEFAULT: '#f97316', // orange-500
          dark: '#ea580c', // orange-600
          light: '#fb923c', // orange-400
        },

        // Accent: Emerald green for positive actions
        accent: {
          DEFAULT: '#10b981', // emerald-500
          dark: '#059669', // emerald-600
          light: '#34d399', // emerald-400
        },

        // Warning: Amber for warnings and notifications
        warning: {
          DEFAULT: '#f59e0b', // amber-500
          dark: '#d97706', // amber-600
          light: '#fbbf24', // amber-400
        },

        // Error: Red for errors and failures
        error: {
          DEFAULT: '#ef4444', // red-500
          dark: '#dc2626', // red-600
          light: '#f87171', // red-400
        },

        // Purple accent for special features
        'accent-purple': {
          DEFAULT: '#8b5cf6', // violet-500
          dark: '#7c3aed', // violet-600
          light: '#a78bfa', // violet-400
        },
      },
      spacing: {
        // Touch-friendly minimum sizes
        touch: '44px',
      },
      minHeight: {
        touch: '44px',
      },
      minWidth: {
        touch: '44px',
      },
      boxShadow: {
        'glow-sm': '0 0 10px rgba(59, 130, 246, 0.3)',
        'glow-md': '0 0 20px rgba(59, 130, 246, 0.4)',
        'glow-lg': '0 0 30px rgba(59, 130, 246, 0.5)',
        'inner-glow': 'inset 0 0 20px rgba(59, 130, 246, 0.2)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
        'gradient-accent': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        'gradient-dark': 'linear-gradient(180deg, #111827 0%, #0a0e1a 100%)',
        'gradient-ocean': 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        'gradient-mesh': 'radial-gradient(at 0% 0%, #1e3a8a 0px, transparent 50%), radial-gradient(at 100% 100%, #1e40af 0px, transparent 50%), radial-gradient(at 50% 0%, #0f172a 0px, transparent 50%)',
      },
      keyframes: {
        'slide-up': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)' },
          '50%': { boxShadow: '0 0 30px rgba(59, 130, 246, 0.6)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slide-down 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fade-in 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in-up': 'fade-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'shimmer': 'shimmer 3s linear infinite',
        'float': 'float 3s ease-in-out infinite',
      },
    },
    // Mobile-first breakpoints
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
  },
  plugins: [],
};
