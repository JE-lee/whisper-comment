import { defineConfig } from '@twind/core'
import presetAutoprefix from '@twind/preset-autoprefix'
import presetTailwind from '@twind/preset-tailwind'

export default defineConfig({
  presets: [presetAutoprefix(), presetTailwind()],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'],
      },
      animation: {
        'like-bounce': 'likeBounce 0.3s ease-in-out',
        'dislike-bounce': 'dislikeBounce 0.3s ease-in-out',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'expand': 'expand 0.3s ease-out',
        'collapse': 'collapse 0.3s ease-in',
        'fade-in': 'fadeIn 0.4s ease-out',
        'fade-out': 'fadeOut 0.2s ease-in',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-in',
      },
      keyframes: {
        likeBounce: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)' }
        },
        dislikeBounce: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)' }
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.5' }
        },
        expand: {
          '0%': { 
            maxHeight: '0',
            opacity: '0',
            transform: 'translateY(-8px) scale(0.98)'
          },
          '50%': {
            opacity: '0.6',
            transform: 'translateY(-4px) scale(0.99)'
          },
          '100%': { 
            maxHeight: '2000px',
            opacity: '1',
            transform: 'translateY(0) scale(1)'
          }
        },
        collapse: {
          '0%': { 
            maxHeight: '2000px',
            opacity: '1',
            transform: 'translateY(0) scale(1)'
          },
          '50%': {
            opacity: '0.4',
            transform: 'translateY(-4px) scale(0.99)'
          },
          '100%': { 
            maxHeight: '0',
            opacity: '0',
            transform: 'translateY(-8px) scale(0.98)'
          }
        },
        fadeIn: {
          '0%': { 
            opacity: '0',
            transform: 'translateY(10px) scale(0.95)'
          },
          '100%': { 
            opacity: '1',
            transform: 'translateY(0) scale(1)'
          }
        },
        fadeOut: {
          '0%': { 
            opacity: '1',
            transform: 'translateY(0) scale(1)'
          },
          '100%': { 
            opacity: '0',
            transform: 'translateY(-10px) scale(0.95)'
          }
        },
        slideDown: {
          '0%': { 
            maxHeight: '0',
            opacity: '0'
          },
          '100%': { 
            maxHeight: '500px',
            opacity: '1'
          }
        },
        slideUp: {
          '0%': { 
            maxHeight: '500px',
            opacity: '1'
          },
          '100%': { 
            maxHeight: '0',
            opacity: '0'
          }
        }
      }
    }
  }
}) 
