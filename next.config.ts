import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The site home now shows the Timer promo page (public/timer/index.html).
  // Remove this rewrite to bring back the 学习搭子 home page.
  async rewrites() {
    return { beforeFiles: [{ source: "/", destination: "/timer/index.html" }] };
  },
};

export default nextConfig;
