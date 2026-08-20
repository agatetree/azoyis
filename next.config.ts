const nextConfig: NextConfig = {
  // ...whatever is already there stays...
  async rewrites() {
    return [
      { source: "/lchaim", destination: "/lchaim/index.html" },
      { source: "/radar", destination: "/radar/index.html" },
    ];
  },
};
