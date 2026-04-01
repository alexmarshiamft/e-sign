/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        signature1: ['"Dancing Script"', 'cursive'],
        signature2: ['"Great Vibes"', 'cursive'],
        signature3: ['"Pacifico"', 'cursive'],
        signature4: ['"Caveat"', 'cursive'],
      },
    },
  },
  plugins: [],
};
