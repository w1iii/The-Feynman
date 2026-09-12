import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['groq-sdk'],
  experimental: {
    serverActions: { bodySizeLimit: '2mb' },
  },
};

export default nextConfig;
