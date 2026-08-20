import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/lchaim", destination: "/lchaim/index.html" },
      { source: "/radar", destination: "/radar/index.html" },
    ];
  },
};

export default nextConfig;
