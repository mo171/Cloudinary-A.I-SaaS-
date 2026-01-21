import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Enable larger body size for file uploads in App Router
    serverComponentsExternalPackages: ['@prisma/client'],
  },
};

export default nextConfig;
