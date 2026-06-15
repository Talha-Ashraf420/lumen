import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output only inside Docker (set by the Dockerfile). Locally this
  // stays undefined so `npm run dev` / `npm start` work normally.
  output: process.env.STANDALONE_BUILD === "1" ? "standalone" : undefined,
};

export default nextConfig;
