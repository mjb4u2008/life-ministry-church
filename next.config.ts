import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-src 'self' https://www.zeffy.com https://www.tiktok.com; frame-ancestors 'self';",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
