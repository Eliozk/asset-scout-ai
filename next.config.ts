import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Poly Haven thumbnails only — narrow on purpose, see AGENTS.md.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.polyhaven.com",
      },
    ],
  },
};

export default nextConfig;
