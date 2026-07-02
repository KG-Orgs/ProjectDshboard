import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './test/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          500: '#0078d4',
          600: '#005a9e',
          700: '#004377',
        },
        surface: {
          0: '#ffffff',
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
        },
        // Keep dark workspace colors for backwards compat
        workspace: {
          950: '#080b12',
          900: '#0f1421',
          850: '#141b2b',
          800: '#1a2437',
          700: '#23314b',
          600: '#32507b',
          accent: '#3b82f6',
          accentSoft: '#60a5fa',
        },
      },
      boxShadow: {
        panel: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
        card: '0 2px 8px rgba(0,0,0,0.06)',
        elevated: '0 4px 20px rgba(0,0,0,0.10)',
        glow: '0 0 0 1px rgba(96, 165, 250, 0.35), 0 8px 24px rgba(37, 99, 235, 0.28)',
      },
      borderRadius: {
        panel: '12px',
      },
    },
  },
  plugins: [],
};

export default config;
