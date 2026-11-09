import type { Metadata } from "next";
import { loadAppCatalog } from "@audite/content/app-catalog";
import { LibraryProvider } from "@/components/library";
import { RegisterServiceWorker } from "@/components/register-sw";
import { AppFrame, MiniPlayer, TabBar } from "@/components/site-chrome";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Audite", template: "%s · Audite" },
  description: "Audite. Una escucha de la Biblia, de principio a fin.",
  robots: { index: false, follow: false },
  icons: {
    icon: [
      { url: "/marca/favicon.ico" },
      { url: "/marca/audite_marca_oscuro_32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/marca/audite_marca_oscuro_180.png", sizes: "180x180" }],
  },
};

const themeScript = `try{var s=JSON.parse(localStorage.getItem("audite.settings.v1")||"{}");var t=s.theme||"dark";var d=t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.dataset.theme=d?"dark":"light";document.documentElement.classList.toggle("dark",d);document.documentElement.dataset.text=s.textScale||"md";document.documentElement.lang=s.uiLocale==="en"?"en":"es";}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const catalogoCompleto = loadAppCatalog();
  const catalog = { ...catalogoCompleto, rangos: [], pendientes: [] };
  return (
    <html lang="es" className="h-full" data-demo={process.env.AUDITE_DEMO === "1" ? "1" : undefined} suppressHydrationWarning>
      <body className="min-h-full bg-background font-sans text-foreground antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <style>{`body{margin:0;background:#100e0c;color:#f4ece2}:root[data-theme="light"] body{background:#f3ecdf;color:#161310}`}</style>
        <LibraryProvider catalog={catalog}>
          <AppFrame>{children}</AppFrame>
          <MiniPlayer />
          <TabBar />
          <RegisterServiceWorker />
        </LibraryProvider>
      </body>
    </html>
  );
}
