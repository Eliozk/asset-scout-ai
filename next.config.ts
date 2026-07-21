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
      {
        protocol: "https",
        hostname: "cdn.pixabay.com",
      },
      {
        protocol: "https",
        hostname: "pixabay.com",
        pathname: "/get/**",
      },
    ],
  },
};

export default nextConfig;
