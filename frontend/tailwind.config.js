/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // ── Typography ─────────────────────────────────────────────────
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        display: ['"Inter Tight"', '"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"SF Mono"', 'Menlo', 'monospace'],
      },
      fontSize: {
        // Enterprise scale — tight, controlled
        '2xs':    ['10px', { lineHeight: '14px', letterSpacing: '0.04em' }],
        'xs':     ['11px', { lineHeight: '16px', letterSpacing: '0.02em' }],
        'sm':     ['13px', { lineHeight: '20px', letterSpacing: '-0.005em' }],
        'base':   ['14px', { lineHeight: '22px', letterSpacing: '-0.01em' }],
        'lg':     ['16px', { lineHeight: '24px', letterSpacing: '-0.015em' }],
        'xl':     ['18px', { lineHeight: '28px', letterSpacing: '-0.02em' }],
        '2xl':    ['22px', { lineHeight: '30px', letterSpacing: '-0.022em' }],
        '3xl':    ['28px', { lineHeight: '36px', letterSpacing: '-0.025em' }],
        '4xl':    ['34px', { lineHeight: '42px', letterSpacing: '-0.028em' }],
        '5xl':    ['44px', { lineHeight: '52px', letterSpacing: '-0.032em' }],
        '6xl':    ['56px', { lineHeight: '64px', letterSpacing: '-0.036em' }],
      },
      letterSpacing: {
        tightest: '-0.04em',
        tighter:  '-0.025em',
        tight:    '-0.015em',
        normal:   '0',
        wide:     '0.015em',
        wider:    '0.04em',
        widest:   '0.1em',
      },

      // ── Colors ─────────────────────────────────────────────────────
      colors: {
        // Primary — refined indigo (Workday/Keka feel)
        primary: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        // Slate-tinted neutrals (more enterprise, less stark)
        ink: {
          50:  '#f8fafc',
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
      },

      // ── Spacing & Radii ────────────────────────────────────────────
      borderRadius: {
        'xs':  '4px',
        'sm':  '6px',
        DEFAULT: '6px',
        'md':  '8px',
        'lg':  '10px',
        'xl':  '12px',
        '2xl':'14px',
        '3xl':'18px',
      },

      // ── Shadows — subtle, layered (enterprise look) ────────────────
      boxShadow: {
        'xs':          '0 1px 1px 0 rgba(15, 23, 42, 0.04)',
        'sm':          '0 1px 2px 0 rgba(15, 23, 42, 0.04), 0 1px 3px 0 rgba(15, 23, 42, 0.02)',
        DEFAULT:       '0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.03)',
        'md':          '0 2px 4px -1px rgba(15, 23, 42, 0.05), 0 4px 6px -1px rgba(15, 23, 42, 0.04)',
        'lg':          '0 4px 12px -2px rgba(15, 23, 42, 0.06), 0 10px 16px -4px rgba(15, 23, 42, 0.05)',
        'xl':          '0 8px 20px -4px rgba(15, 23, 42, 0.08), 0 20px 25px -8px rgba(15, 23, 42, 0.06)',
        '2xl':         '0 24px 48px -12px rgba(15, 23, 42, 0.18)',
        'soft':        '0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 4px 12px -2px rgba(15, 23, 42, 0.04)',
        'card':        '0 0 0 1px rgba(15, 23, 42, 0.04), 0 1px 2px 0 rgba(15, 23, 42, 0.04)',
        'card-hover':  '0 0 0 1px rgba(15, 23, 42, 0.06), 0 8px 16px -4px rgba(15, 23, 42, 0.08)',
        'sidebar':     '1px 0 0 0 rgba(15, 23, 42, 0.06)',
        'dropdown':    '0 4px 6px -2px rgba(15, 23, 42, 0.05), 0 10px 15px -3px rgba(15, 23, 42, 0.08)',
        'modal':       '0 24px 48px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(15, 23, 42, 0.05)',
        'inner-soft':  'inset 0 1px 2px 0 rgba(15, 23, 42, 0.04)',
        'focus':       '0 0 0 3px rgba(99, 102, 241, 0.2)',
      },

      // ── Animations ─────────────────────────────────────────────────
      animation: {
        'fade-in':        'fadeIn 0.2s ease-out',
        'fade-in-slow':   'fadeIn 0.4s ease-out',
        'slide-up':       'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down':     'slideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-right': 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in':       'scaleIn 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-soft':     'pulseSoft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-slow':     'pulseSlow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer':        'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn:       { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp:      { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideDown:    { '0%': { opacity: '0', transform: 'translateY(-8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideInRight: { '0%': { opacity: '0', transform: 'translateX(10px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
        scaleIn:      { '0%': { opacity: '0', transform: 'scale(0.97)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        pulseSoft:    { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.5' } },
        pulseSlow:    { '0%, 100%': { opacity: '1', boxShadow: '0 0 0 0 rgba(220, 38, 38, 0.4)' }, '50%': { opacity: '0.92', boxShadow: '0 0 0 6px rgba(220, 38, 38, 0)' } },
        shimmer:      { '0%': { backgroundPosition: '-1000px 0' }, '100%': { backgroundPosition: '1000px 0' } },
      },
    },
  },
  plugins: [],
}
