import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  async redirects() {
    return [
      {
        source: "/team-dashboard",
        destination: "https://mftel-db.vercel.app",
        permanent: false, // 307 임시 리다이렉트 (나중에 되돌릴 수 있도록)
      },
    ];
  },
};

export default nextConfig;
