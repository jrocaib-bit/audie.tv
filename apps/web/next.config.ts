import type { NextConfig } from "next";

/** Alias en inglés del índice canónico. Los slugs son los mismos en todos los idiomas: /en/biblia. */
export const redireccionesBiblia = [
  { source: "/en/bible", destination: "/en/biblia", permanent: true },
  { source: "/:lang(es|it|pt|fr|de|zh)/bible", destination: "/:lang/biblia", permanent: true },
];

const nextConfig: NextConfig = {
  async redirects() {
    return redireccionesBiblia;
  },
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
  // El texto de Torres Amat (dominio público) se lee del disco en la ruta de la API. Sin esto, el despliegue no lo lleva.
  outputFileTracingIncludes: { "/api/texto/**": ["../../content/texto/torres-amat/**/*"] },
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
