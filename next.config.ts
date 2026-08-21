import os from "node:os";
import type { NextConfig } from "next";

// Next's dev server refuses /_next/* requests from any origin but localhost,
// so opening the dev site on a phone over the LAN loads the HTML but never
// boots React — the page looks fine and nothing is interactive. Reading the
// machine's current LAN addresses keeps that working after a network change,
// instead of hardcoding an IP that goes stale. Dev-only; ignored in production.
function lanOrigins() {
  const hosts: string[] = [];
  for (const iface of Object.values(os.networkInterfaces())) {
    for (const net of iface ?? []) {
      if (net.family === "IPv4" && !net.internal) hosts.push(net.address);
    }
  }
  return hosts;
}

const nextConfig: NextConfig = {
  allowedDevOrigins: lanOrigins(),
  async rewrites() {
    return [
      { source: "/lchaim", destination: "https://lchaim.vercel.app/lchaim/" },
      { source: "/lchaim/:path*", destination: "https://lchaim.vercel.app/lchaim/:path*" },
      { source: "/radar", destination: "/radar/index.html" },
    ];
  },
};

export default nextConfig;
