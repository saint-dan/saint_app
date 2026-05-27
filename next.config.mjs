import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  // Disables PWA generation in dev mode to prevent caching issues while coding
  disable: process.env.NODE_ENV === "development", 
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your standard Next.js configuration goes here
  // Silences the warning so you can use lightning-fast Turbopack in local dev
  turbopack: {},
};

export default withPWA(nextConfig);