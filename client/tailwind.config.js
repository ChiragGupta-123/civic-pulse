/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: 'var(--color-paper)',
          2: 'var(--color-paper-2)',
          3: 'var(--color-paper-3)',
        },
        ink: {
          DEFAULT: 'var(--color-ink)',
          2: 'var(--color-ink-2)',
        },
        muted: 'var(--color-muted)',
        rule: 'var(--color-rule)',
        accent: {
          DEFAULT: 'var(--color-accent)',
          ink: 'var(--color-accent-ink)',
          soft: 'var(--color-accent-soft)',
        },
        focus: 'var(--color-focus)',
        green: {
          DEFAULT: 'var(--color-green)',
          soft: 'var(--color-green-soft)',
        },
        contour: 'var(--color-contour)',
        water: 'var(--color-water)',
        hedge: 'var(--color-hedge)',
        grid: {
          DEFAULT: 'var(--color-grid)',
          strong: 'var(--color-grid-strong)',
        },
        sheet: 'var(--color-sheet)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'ui-sans-serif', 'sans-serif'],
        sans: ['var(--font-body)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-outlier)', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        card: 'var(--radius-card)',
        entry: 'var(--radius-entry)',
        pill: 'var(--radius-pill)',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        lift: 'var(--shadow-lift)',
        subtle: '0 1px 2px oklch(18% 0.006 60 / 0.06)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 180ms cubic-bezier(0.16, 1, 0.3, 1) both',
      },
    },
  },
  plugins: [],
};
