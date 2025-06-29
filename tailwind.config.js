const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        // Remove old 'propagentic' theme block
        // NEW Semantic Color Palette
        primary: {
          50: '#EEF7FF',
          100: '#D9EDFF', 
          200: '#BCDDFF',
          300: '#8FC4FF',
          400: '#5BA2FF',
          500: '#0374B5', // Canvas blue
          600: '#025A94',
          700: '#024173',
          800: '#012952',
          900: '#001A36'
        },
        secondary: {
          DEFAULT: '#3B82F6', // Blue as complement
          // OR purple: '#8B5CF6' 
        },
        neutral: {
          50: '#F8F9FA',   // Canvas light background
          100: '#E7E8EA',  // Canvas border color
          200: '#C7CDD1',  // Light borders
          300: '#A7AFB5',  // Disabled text
          400: '#8B95A0',  // Secondary text
          500: '#73818F',  // Canvas secondary text
          600: '#5B6C7A',  // Tertiary text
          700: '#445566',  // Strong text
          800: '#2D3B45',  // Canvas primary text
          900: '#1A2329'   // Darkest text
        },
        // Semantic colors using the palette above
        background: {
          DEFAULT: defaultTheme.colors.white, // Light mode base (#FFFFFF)
          subtle: '#F9FAFB',                 // Light mode subtle sections (neutral-50)
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
          50: '#E6F7E6',
          100: '#B3E5B3',
          200: '#80D280',
          300: '#4DC04D',
          400: '#1AAD1A',
          500: '#00AC18', // Canvas green
          600: '#008A13',
          700: '#00690F',
          800: '#00470A',
          900: '#002605'
        },
        warning: {
          50: '#FFF4E6',
          100: '#FFE0B3',
          200: '#FFCC80',
          300: '#FFB84D',
          400: '#FFA41A',
          500: '#FC5E13', // Canvas orange
          600: '#E0520F',
          700: '#B8420C',
          800: '#8F3209',
          900: '#661F05'
        },
        error: {
          50: '#FDF2F2',
          100: '#FCDCDC',
          200: '#FAB8B8',
          300: '#F89494',
          400: '#F56F6F',
          500: '#EE0612', // Canvas red
          600: '#D1050F',
          700: '#A6040C',
          800: '#7A0309',
          900: '#4F0206'
        },
        pa: {
          blue: {
            600: '#1742BF',
            50: '#E7F0FF'
          },
          orange: {
            500: '#FF8A30'
          }
        }
      },
      fontFamily: {
        sans: ['LatoWeb', 'Lato', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['Monaco', 'Menlo', 'Ubuntu Mono', 'monospace']
      },
      boxShadow: {
        // Keep existing or define new shadows using new palette
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)', // Example subtle shadow
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.04)', // Example hover shadow
        'canvas-sm': '0 1px 2px 0 rgba(45, 59, 69, 0.05)',
        'canvas-md': '0 4px 6px -1px rgba(45, 59, 69, 0.1), 0 2px 4px -1px rgba(45, 59, 69, 0.06)',
        'canvas-lg': '0 10px 15px -3px rgba(45, 59, 69, 0.1), 0 4px 6px -2px rgba(45, 59, 69, 0.05)',
        'canvas-xl': '0 20px 25px -5px rgba(45, 59, 69, 0.1), 0 10px 10px -5px rgba(45, 59, 69, 0.04)',
        'canvas-2xl': '0 25px 50px -12px rgba(45, 59, 69, 0.25)',
        'canvas-inner': 'inset 0 2px 4px 0 rgba(45, 59, 69, 0.06)'
      },
      spacing: {
        '18': '4.5rem',   // 72px
        '88': '22rem',    // 352px - Canvas sidebar width
        '92': '23rem',    // 368px
        '96': '24rem',    // 384px
        '104': '26rem',   // 416px
        '112': '28rem',   // 448px
        '128': '32rem',   // 512px
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
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        carouselSlide: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' }
        },
        pulse: {
          '0%, 100%': { 
            opacity: 1,
            transform: 'scale(1)'
          },
          '50%': { 
            opacity: 0.85,
            transform: 'scale(1.05)'
          }
        },
        softGlow: {
          '0%, 100%': {
            boxShadow: '0 0 0 0 rgba(59, 130, 246, 0)'
          },
          '50%': {
            boxShadow: '0 0 8px 3px rgba(59, 130, 246, 0.3)'
          }
        },
        floatVertical: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' }
        }
      },
      animation: {
        draw: 'draw 0.7s ease forwards',
        'canvas-fade-in': 'fadeIn 0.2s ease-in-out',
        'canvas-slide-in': 'slideIn 0.3s ease-in-out',
        'canvas-scale-in': 'scaleIn 0.2s ease-in-out',
        'carousel': 'carouselSlide 25s linear infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'soft-glow': 'softGlow 2s ease-in-out infinite',
        'float': 'floatVertical 3s ease-in-out infinite'
      },
      screens: {
        'sm': '576px',
        'md': '768px', 
        'lg': '992px',
        'xl': '1200px',
        '2xl': '1400px',
      },
      borderRadius: {
        'canvas-sm': '4px',
        'canvas-md': '6px', 
        'canvas-lg': '8px',
        'canvas-xl': '12px',
        'canvas-2xl': '16px'
      },
      gridTemplateColumns: {
        'canvas-dashboard': '320px 1fr 280px',
        'canvas-content': '240px 1fr 240px',
        'canvas-sidebar': '280px 1fr',
        'canvas-mobile': '1fr'
      },
      zIndex: {
        'canvas-dropdown': '1000',
        'canvas-sticky': '1020',
        'canvas-fixed': '1030',
        'canvas-modal-backdrop': '1040',
        'canvas-modal': '1050',
        'canvas-popover': '1060',
        'canvas-tooltip': '1070'
      },
      maxWidth: {
        'canvas-xs': '20rem',   // 320px
        'canvas-sm': '24rem',   // 384px  
        'canvas-md': '28rem',   // 448px
        'canvas-lg': '32rem',   // 512px
        'canvas-xl': '36rem',   // 576px
        'canvas-2xl': '42rem',  // 672px
        'canvas-3xl': '48rem',  // 768px
        'canvas-4xl': '56rem',  // 896px
        'canvas-5xl': '64rem',  // 1024px
        'canvas-6xl': '72rem',  // 1152px
        'canvas-7xl': '80rem'   // 1280px
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
    function({ addUtilities, theme }) {
      const canvasUtilities = {
        '.canvas-focus': {
          'outline': 'none',
          'box-shadow': `0 0 0 2px ${theme('colors.primary.500')}`,
          'border-color': theme('colors.primary.500')
        },
        '.canvas-card': {
          'background-color': theme('colors.white'),
          'border': `1px solid ${theme('colors.neutral.200')}`,
          'border-radius': theme('borderRadius.canvas-lg'),
          'box-shadow': theme('boxShadow.canvas-md'),
          'transition': 'all 0.2s ease-in-out'
        },
        '.canvas-card:hover': {
          'box-shadow': theme('boxShadow.canvas-lg'),
          'transform': 'translateY(-2px)'
        },
        '.canvas-text-balance': {
          'text-wrap': 'balance'
        },
        '.animation-play-state-paused': {
          'animation-play-state': 'paused'
        },
        '.animation-play-state-running': {
          'animation-play-state': 'running'
        }
      };
      
      addUtilities(canvasUtilities);
    }
  ],
  future: {
    removeDeprecatedGapUtilities: true,
    purgeLayersByDefault: true,
  },
} 