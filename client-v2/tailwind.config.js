/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: 'var(--color-paper)',
          2: 'var(--color-paper-2)',
          3: 'var(--color-paper-3)',
        },
        sheet: 'var(--color-sheet)',
        ink: {
          DEFAULT: 'var(--color-ink)',
          2: 'var(--color-ink-2)',
        },
        muted: 'var(--color-muted)',
        rule: 'var(--color-rule)',
        contour: 'var(--color-contour)',
        water: 'var(--color-water)',
        hedge: 'var(--color-hedge)',
        grid: {
          DEFAULT: 'var(--color-grid)',
          strong: 'var(--color-grid-strong)',
        },
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
        danger: {
          DEFAULT: 'var(--color-error)',
          soft: 'var(--color-error-soft)',
        },
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
        mono: ['var(--font-outlier)'],
      },
      fontSize: {
        '2xs': 'var(--text-2xs)',
        xs: 'var(--text-xs)',
        sm: 'var(--text-sm)',
        base: 'var(--text-base)',
        lg: 'var(--text-lg)',
        xl: 'var(--text-xl)',
        '2xl': 'var(--text-2xl)',
        '3xl': 'var(--text-3xl)',
        '4xl': 'var(--text-4xl)',
      },
      borderRadius: {
        key: 'var(--radius-pill)',
        card: 'var(--radius-card)',
        entry: 'var(--radius-entry)',
        sheet: '3px',
      },
      boxShadow: {
        subtle: 'var(--shadow-subtle)',
        card: 'var(--shadow-card)',
        lift: 'var(--shadow-lift)',
      },
      transitionDuration: {
        micro: 'var(--dur-micro)',
        short: 'var(--dur-short)',
      },
      transitionTimingFunction: {
        out: 'var(--ease-out)',
      },
    },
  },
  plugins: [],
};
