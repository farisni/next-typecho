import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["systeminformation"],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  turbopack: {
    root: process.cwd(),
  },
  outputFileTracingIncludes: {
    "/*": ["./drizzle/migrations/**/*"],
  },
};

export default nextConfig;
