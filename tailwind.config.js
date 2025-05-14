const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Ensure dark mode is enabled via class
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Remove old 'propagentic' theme block
        // NEW Semantic Color Palette
        primary: {
          light: '#5EEAD4',  // teal-300
          DEFAULT: '#14B8A6', // teal-500
          dark: '#0D9488',   // teal-600
          // Add more shades like 50, 100, 700, 800, 900 from Tailwind if needed
          // Example: 700: '#0F766E'
        },
        secondary: {
          light: '#A78BFA',  // violet-400
          DEFAULT: '#8B5CF6', // violet-500
          dark: '#7C3AED',   // violet-600
        },
        neutral: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
        // Semantic colors using the palette above
        background: {
          DEFAULT: defaultTheme.colors.white, // Light mode base (#FFFFFF)
          subtle: '#F9FAFB',                 // Light mode subtle sections (neutral-50)
          dark: '#111827',                    // Dark mode base (neutral-900)
          darkSubtle: '#1F2937',              // Dark mode subtle sections (neutral-800)
        },
        content: {
          DEFAULT: '#1F2937',        // Light mode primary text (neutral-800)
          secondary: '#4B5563',     // Light mode secondary text (neutral-600)
          subtle: '#6B7280',        // Light mode subtle text (neutral-500)
          dark: '#F3F4F6',           // Dark mode primary text (neutral-100)
          darkSecondary: '#9CA3AF', // Dark mode secondary text (neutral-400)
          darkSubtle: '#6B7280',      // Dark mode subtle text (neutral-500)
        },
        border: {
          DEFAULT: '#E5E7EB',        // Light mode borders (neutral-200)
          dark: '#374151',           // Dark mode borders (neutral-700)
        },
        // Status Colors (can be customized further)
        success: {
          DEFAULT: '#10B981', // emerald-500
          content: defaultTheme.colors.white, // Text on success bg
          subtle: '#ECFDF5', // emerald-50 (light bg)
          darkSubtle: '#064E3B', // emerald-900 (dark bg)
        },
        warning: {
          DEFAULT: '#F59E0B', // amber-500
          content: defaultTheme.colors.white,
          subtle: '#FFFBEB', // amber-50
          darkSubtle: '#78350F', // amber-900
        },
        danger: {
          DEFAULT: '#EF4444', // red-500
          content: defaultTheme.colors.white,
          subtle: '#FEF2F2', // red-50
          darkSubtle: '#7F1D1D', // red-900
        },
        info: {
          DEFAULT: '#3B82F6', // blue-500
          content: defaultTheme.colors.white,
          subtle: '#EFF6FF', // blue-50
          darkSubtle: '#1E3A8A', // blue-900
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          ...defaultTheme.fontFamily.sans, // Include Tailwind defaults
        ],
        display: [
          'Poppins',
          'Inter',
          ...defaultTheme.fontFamily.sans,
        ]
      },
      boxShadow: {
        // Keep existing or define new shadows using new palette
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)', // Example subtle shadow
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.04)', // Example hover shadow
      },
      spacing: {
        '72': '18rem',
        '84': '21rem',
        '96': '24rem',
      },
      keyframes: {
        draw: {
          '0%': {
            opacity: 0,
            strokeDasharray: '0, 1000'
          },
          '100%': {
            opacity: 1, 
            strokeDasharray: '1000, 0'
          }
        }
      },
      animation: {
        draw: 'draw 0.7s ease forwards'
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio')
  ],
} 