import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 実機・別ホストから dev の /_next を取るときの警告緩和（開発用）
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};

export default nextConfig;
