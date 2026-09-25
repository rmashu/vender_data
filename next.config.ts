import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.4.123"],
  output: "standalone",
  turbopack: {
    root: process.cwd(),
  },
}

export default nextConfig
