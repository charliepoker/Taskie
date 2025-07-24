import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    typedRoutes: true,
  },
  output: "standalone",
  env: {
    BACKEND_URL: process.env.BACKEND_URL || "http://localhost:5000",
  },
  images: {
    domains: ["localhost"],
  },
};

export default nextConfig;
