/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Sophisticated slate-blue palette (professional, data-forward)
        primary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        // Background colors for surfaces
        background: {
          page: '#fafbfc',
          card: '#ffffff',
          elevated: '#ffffff',
          subtle: '#f8fafc',
          muted: '#f1f5f9',
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
        // Info - neutral informational messages
        info: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
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
        // Data visualization palette for charts
        chart: {
          series1: '#6366f1', // Indigo
          series2: '#8b5cf6', // Purple
          series3: '#ec4899', // Pink
          series4: '#f59e0b', // Amber
          series5: '#10b981', // Emerald
          series6: '#06b6d4', // Cyan
          neutral: '#64748b', // Slate for baselines
          gridLines: '#f1f5f9',
          background: '#fafbfc',
        },
      },
      fontFamily: {
        // System fonts for speed (SF Pro on Mac, Segoe UI on Windows)
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        // Monospace for code/data
        mono: ['SF Mono', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
      },
      fontSize: {
        // Micro text (labels, captions)
        'xs': ['11px', { lineHeight: '16px', letterSpacing: '0.01em' }],
        // Small text (secondary info, table data)
        'sm': ['13px', { lineHeight: '18px', letterSpacing: '0' }],
        // Base body text (paragraphs, descriptions)
        'base': ['15px', { lineHeight: '22px', letterSpacing: '0' }],
        // Large body text (emphasized content)
        'lg': ['17px', { lineHeight: '26px', letterSpacing: '-0.01em' }],
        // Small headings (card titles, section labels)
        'xl': ['19px', { lineHeight: '28px', letterSpacing: '-0.01em' }],
        // Medium headings (page sections)
        '2xl': ['22px', { lineHeight: '30px', letterSpacing: '-0.02em' }],
        // Large headings (page titles)
        '3xl': ['28px', { lineHeight: '36px', letterSpacing: '-0.02em' }],
        // Display text (hero sections)
        '4xl': ['36px', { lineHeight: '42px', letterSpacing: '-0.03em' }],
        // METRICS - Special sizes for data display
        'metric-sm': ['24px', { lineHeight: '30px', letterSpacing: '-0.02em', fontWeight: '600' }],
        'metric-md': ['32px', { lineHeight: '38px', letterSpacing: '-0.03em', fontWeight: '600' }],
        'metric-lg': ['42px', { lineHeight: '48px', letterSpacing: '-0.04em', fontWeight: '600' }],
        'metric-xl': ['56px', { lineHeight: '60px', letterSpacing: '-0.04em', fontWeight: '700' }],
      },
      fontWeight: {
        normal: '400',  // Regular text for labels
        medium: '500',  // Medium weight
        semibold: '600', // Semibold
        bold: '700',    // Bold numbers (they're the hero)
      },
      boxShadow: {
        // Cards at rest
        'card': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        // Cards on hover
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        // Modals, dropdowns (elevated)
        'elevated': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        // Focus states
        'focus': '0 0 0 3px rgba(99, 102, 241, 0.1)',
      },
      spacing: {
        // Generous whitespace
        '18': '4.5rem',
        '22': '5.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'sm': '4px',
        'DEFAULT': '6px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        'card': '8px', // Alias for consistency
      },
      transitionDuration: {
        'fast': '100ms',
        'normal': '150ms',
        'slow': '300ms',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'snappy': 'cubic-bezier(0.2, 0, 0, 1)',
      },
      maxWidth: {
        'dashboard': '1400px',
        'content': '1200px',
        'narrow': '800px',
      },
    },
  },
  plugins: [],
}
