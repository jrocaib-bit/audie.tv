import type { Metadata } from "next";
import { existsSync } from "node:fs";
import path from "node:path";
import { headers } from "next/headers";
import { loadAppCatalog } from "@audite/content/app-catalog";
import { LibraryProvider } from "@/components/library";
import { RegisterServiceWorker } from "@/components/register-sw";
import { Suspense } from "react";
import { MedicionEscucha, MedicionRuta } from "@/components/medicion-cliente";
import { Plausible } from "@/components/plausible";
import { AppFrame, MiniPlayer, TabBar, VeloCromo } from "@/components/site-chrome";
import { debeNoindex, origenSitio } from "@/lib/sitio-publico";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const host = (await headers()).get("host") ?? "";
  const base = origenSitio();
  return {
    metadataBase: new URL(base),
    title: { default: "Audite", template: "%s · Audite" },
    description: "La Biblia, de principio a fin.",
    robots: debeNoindex(host) ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: { title: "Audite", description: "La Biblia, de principio a fin.", images: [`${base}/obras/reto-adviento_o1-16x9.webp`] },
    icons: {
    icon: [
      { url: "/marca/favicon.ico" },
      { url: "/marca/audite_marca_oscuro_32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/marca/audite_marca_oscuro_180.png", sizes: "180x180" }],
  },
  };
}

const themeScript = `try{var s=JSON.parse(localStorage.getItem("audite.settings.v1")||"{}");var t=s.theme||"dark";var d=t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.dataset.theme=d?"dark":"light";document.documentElement.classList.toggle("dark",d);document.documentElement.dataset.text=s.textScale||"md";document.documentElement.lang=s.uiLocale==="en"?"en":"es";}catch(e){}`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const catalogoCompleto = loadAppCatalog();
  const catalog = { ...catalogoCompleto, rangos: [], pendientes: [], fuenteTexto: { es: null, en: null } };
  const lang = (await headers()).get("x-audite-lang") || "es";
  const gazpacho = existsSync(path.join(process.cwd(), "public/fonts/gazpacho/faces.css"));
  return (
    <html lang={lang} className="h-full" data-demo={process.env.AUDITE_DEMO === "1" ? "1" : undefined} suppressHydrationWarning>
      <body className="min-h-full bg-background font-sans text-foreground antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <style>{`body{margin:0;background:#100e0c;color:#f4ece2}:root[data-theme="light"] body{background:#f3ecdf;color:#161310}`}</style>
        {gazpacho ? <link rel="stylesheet" href="/fonts/gazpacho/faces.css" /> : null}
        <Plausible />
        <LibraryProvider catalog={catalog}>
          <MedicionRuta />
          <MedicionEscucha />
          <AppFrame>{children}</AppFrame>
          <VeloCromo />
          <Suspense>
            <MiniPlayer />
          </Suspense>
          <TabBar />
          <RegisterServiceWorker />
        </LibraryProvider>
      </body>
    </html>
  );
}
