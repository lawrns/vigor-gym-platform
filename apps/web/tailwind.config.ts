import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#E7FFF8',
          100: '#C8FFEE',
          200: '#8AFCDD',
          300: '#4DF9C2',
          400: '#10F7A7',
          500: '#00C6A2',
          600: '#009A81',
          700: '#039A7E',
          800: '#026E5A',
          900: '#014236'
        },
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-alt': 'var(--surface-alt)',
        card: 'var(--card)',
        muted: 'var(--muted)',
        text: 'var(--text)',
        heading: 'var(--heading)',
        primary: 'var(--primary)',
        'primary-emph': 'var(--primary-emph)',
        secondary: 'var(--secondary)',
        accent: 'var(--accent)'
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        elevated: 'var(--shadow-elevated)'
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '28px',
        full: '999px'
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        display: ['var(--font-display)']
      },
      transitionDuration: {
        fast: '150ms',
        base: '300ms',
        slow: '600ms'
      }
    }
  },
  plugins: []
};

export default config;


