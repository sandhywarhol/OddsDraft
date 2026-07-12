import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable the App Router client-side route segment cache so every
  // navigation fetches fresh server data instead of serving stale HTML.
  // Without this, Next.js 15/16 caches rendered pages for 30s (dynamic)
  // or 5min (static) client-side, causing "old appearance" after navigating.
  experimental: {
    staleTimes: {
      dynamic: 0,
      static: 30,
    },
  },
};

export default nextConfig;
