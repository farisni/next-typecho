import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["systeminformation"],
  turbopack: {
    root: process.cwd(),
  },
  outputFileTracingIncludes: {
    "/*": ["./drizzle/migrations/**/*"],
  },
};

export default nextConfig;
