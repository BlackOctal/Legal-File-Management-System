import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove this line: output: "export",
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // ignoreBuildErrors: true,
  },
  // Add this to prevent API routes from interfering
  rewrites: async () => {
    return [];
  },
};

export default nextConfig;