import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    optimizeCss: true,
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
};

export default nextConfig;
