/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        white: '#ffffff',
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
        blue: {
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        orange: {
          500: '#f97316',
          600: '#ea580c',
        },
        green: {
          100: '#dcfce7',
          600: '#16a34a',
        },
        amber: {
          100: '#fef3c7',
          600: '#d97706',
        },
        red: {
          100: '#fee2e2',
          600: '#dc2626',
        }
      },
      boxShadow: {
        soft: '0 2px 4px rgba(0, 0, 0, 0.05)',
        hover: '0 4px 6px rgba(0, 0, 0, 0.07)'
      }
    },
  },
  plugins: [],
} 