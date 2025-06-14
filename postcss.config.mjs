// postcss.config.mjs
export default {
  plugins: {
    '@tailwindcss/postcss': {},   // ← Tailwind’s PostCSS plugin entrypoint
    autoprefixer: {},             // ← still autoprefixer
  },
};
