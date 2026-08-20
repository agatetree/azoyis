import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/lchaim", destination: "https://lchaim.vercel.app/lchaim/" },
      { source: "/lchaim/:path*", destination: "https://lchaim.vercel.app/lchaim/:path*" },
      { source: "/radar", destination: "/radar/index.html" },
    ];
  },
};

export default nextConfig;
