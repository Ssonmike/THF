import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  // Disable the Turbopack "N" dev indicator badge
  devIndicators: false,
};

export default nextConfig;
