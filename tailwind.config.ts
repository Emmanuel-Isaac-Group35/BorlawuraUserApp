import type { Config } from 'tailwindcss';
import nativewind from 'nativewind/tailwind/native.js';

export default {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./index.{js,jsx,ts,tsx}",
  ],
  presets: [nativewind],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Montserrat', 'system-ui', 'sans-serif'],
        'pacifico': ['Pacifico', 'serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
