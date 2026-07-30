import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Local-review convenience: proxy same-origin /api/* to the Railway backend so
  // the browser is not blocked by CORS when running on localhost:3100 (the
  // backend only allowlists localhost:3000 + the Vercel domain). In production
  // the client uses the absolute NEXT_PUBLIC_API_URL and never hits this path.
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://pathai-production.up.railway.app/api/:path*",
      },
    ];
  },
};

export default nextConfig;
