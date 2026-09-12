import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.4.123"],
  turbopack: {
    root: process.cwd(),
  },
}

export default nextConfig
