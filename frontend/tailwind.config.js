/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // SoundMint design tokens (PRD §15.3)
        bg:        '#0D0D0D',
        surface:   '#1A1A2E',
        primary:   '#A044FF',
        secondary: '#12D8FA',
        text:      '#F0F0F0',
        muted:     '#888888',
        success:   '#43E97B',
        error:     '#FF512F',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-primary':   '0 0 20px rgba(160, 68, 255, 0.4)',
        'glow-secondary': '0 0 20px rgba(18, 216, 250, 0.4)',
        'glow-success':   '0 0 20px rgba(67, 233, 123, 0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow':  'spin 4s linear infinite',
      },
      backgroundImage: {
        'gradient-primary':   'linear-gradient(135deg, #A044FF, #12D8FA)',
        'gradient-surface':   'linear-gradient(135deg, #1A1A2E, #16213E)',
      },
    },
  },
  plugins: [],
}
