/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#03040A',
        abyss: '#071426',
        nebula: '#6E44FF',
        cyan: { cosmic: '#64E8FF' },
        stellar: '#F4F7FF',
        gold: '#FFC878',
        muted: '#9AA3BD',
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      letterSpacing: { cosmic: '0.32em' },
    },
  },
  plugins: [],
};
