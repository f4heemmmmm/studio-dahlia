import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    // Hand-painted texture and glitter break up badly at the default 75
    qualities: [90],
  },
};

export default nextConfig;
