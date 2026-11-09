import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { loadAppCatalog } from "@audite/content/app-catalog";
import { LibraryProvider } from "@/components/library";
import { RegisterServiceWorker } from "@/components/register-sw";
import { AppFrame, MiniPlayer, TabBar } from "@/components/site-chrome";
import "./globals.css";

const sans = Outfit({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-outfit",
  display: "swap",
  preload: true,
  adjustFontFallback: false,
});
const serif = Fraunces({
  subsets: ["latin"],
  weight: "600",
  variable: "--font-newsreader",
  display: "swap",
  preload: true,
  adjustFontFallback: false,
  fallback: ["Georgia", "serif"],
});

export const metadata: Metadata = {
  title: { default: "Audite", template: "%s · Audite" },
  description: "Audite. Una escucha de la Biblia, de principio a fin.",
  robots: { index: false, follow: false },
};

const themeScript = `try{var s=JSON.parse(localStorage.getItem("audite.settings.v1")||"{}");var t=s.theme||"system";var d=t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.dataset.theme=d?"dark":"light";document.documentElement.classList.toggle("dark",d);document.documentElement.dataset.text=s.textScale||"md";document.documentElement.lang=s.uiLocale==="en"?"en":"es";}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const catalogoCompleto = loadAppCatalog();
  const catalog = { ...catalogoCompleto, rangos: [], pendientes: [], episodes: [], artworks: [], cues: [], captions: [] };
  return (
    <html lang="es" className={`${sans.variable} ${serif.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full bg-background font-sans text-foreground antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <style>{`body{margin:0;background:#f3ecdf;color:#161310}:root[data-theme="dark"] body{background:#100e0c;color:#f4ece2}`}</style>
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
