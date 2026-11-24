import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/fonts/gazpacho/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
  images: {
    // En previsualización el DNS del host de obras puede resolver a 198.18.0.0/15, que Next trata
    // como IP privada (SSRF) y rechaza con 400. Solo fuera de producción se permite; en producción
    // el host resuelve a IPs públicas y la protección sigue activa.
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "qdjowihivtqoelurvyke.supabase.co",
        pathname: "/storage/v1/object/public/obras/**",
      },
    ],
  },
  devIndicators: false,
  allowedDevOrigins: ["127.0.0.1"],
  transpilePackages: ["@audite/domain", "@audite/content"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
