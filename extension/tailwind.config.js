/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{ts,tsx,html}"],
  theme: {
    extend: {
      fontFamily: {
        system: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
