/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Professional blue palette (trustworthy, data-focused)
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        // Success/positive - revenue growth, high conversion
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        // Warning - underperforming channels
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        // Danger - losses, failed integrations
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        // Neutral grays for text hierarchy, whites for cards
        gray: {
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
      },
      fontFamily: {
        // System fonts for speed (SF Pro on Mac, Segoe UI on Windows)
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      fontSize: {
        // Typography scale following design principles
        'xs': ['12px', { lineHeight: '16px' }],      // Secondary info
        'sm': ['14px', { lineHeight: '20px' }],      // Body text
        'base': ['16px', { lineHeight: '24px' }],    // Body text
        'lg': ['18px', { lineHeight: '28px' }],      // Large body
        'xl': ['20px', { lineHeight: '28px' }],      // Subheadings
        '2xl': ['24px', { lineHeight: '32px' }],     // Key metrics (small)
        '3xl': ['30px', { lineHeight: '36px' }],     // Key metrics
        '4xl': ['36px', { lineHeight: '40px' }],     // Key metrics (large)
        '5xl': ['48px', { lineHeight: '1' }],        // Hero numbers
        '6xl': ['60px', { lineHeight: '1' }],        // Hero numbers (large)
      },
      fontWeight: {
        normal: '400',  // Regular text for labels
        medium: '500',  // Medium weight
        semibold: '600', // Semibold
        bold: '700',    // Bold numbers (they're the hero)
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
      spacing: {
        // Generous whitespace
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'card': '8px',
      },
    },
  },
  plugins: [],
}
