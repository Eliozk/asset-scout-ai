import type { NextConfig } from "next";

/**
 * Deliberately NOT a Content-Security-Policy: the local semantic model
 * (@huggingface/transformers) downloads its ONNX weights + tokenizer from
 * Hugging Face's CDN (huggingface.co and its LFS storage hosts), which
 * rotates/uses multiple subdomains that aren't fully enumerable without
 * live testing every one. A `connect-src`/`script-src` CSP tight enough to
 * be meaningful risks silently breaking model loading (and/or the
 * next/image remote hosts, or one of the 10 external marketplace links) —
 * see Milestone 5's explicit instruction not to add one without testing
 * every required domain first. The headers below are all safe, standard,
 * and don't restrict any outbound host at all.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

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
      {
        protocol: "https",
        hostname: "acg-media.struffelproductions.com",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
      {
        protocol: "https",
        hostname: "images-assets.nasa.gov",
      },
      {
        protocol: "https",
        hostname: "api.openverse.org",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
