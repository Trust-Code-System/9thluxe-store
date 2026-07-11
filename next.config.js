/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  turbopack: {
    // Avoid accidentally picking up lockfiles outside this repo (monorepo/root inference).
    root: __dirname,
  },
};

module.exports = nextConfig;
