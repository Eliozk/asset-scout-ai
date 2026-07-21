import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Only sources we actually normalize thumbnails from — narrow on purpose, see AGENTS.md.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.polyhaven.com",
      },
      {
        protocol: "https",
        hostname: "media.sketchfab.com",
      },
      {
        protocol: "https",
        hostname: "kenney.nl",
      },
    ],
  },
};

export default nextConfig;
