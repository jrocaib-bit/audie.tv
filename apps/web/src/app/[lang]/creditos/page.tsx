import type { Metadata } from "next";
import { loadAppCatalog } from "@audite/content/app-catalog";
import { obrasVisibles } from "@audite/content/obras";
import { portadasDeRetos } from "@audite/content/obras-creditos";
import { creditoVisible } from "@audite/domain";

export const metadata: Metadata = { title: "Créditos" };

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const ui = lang === "en" ? "en" : "es";
  return (
    <main className="mx-auto min-h-full w-full max-w-lg bg-background px-5 py-8 text-foreground">
      <h1 className="font-display text-4xl">{ui === "en" ? "Credits" : "Créditos"}</h1>
      <p className="mt-4 text-sm">{creditoVisible(loadAppCatalog().fuenteTexto[ui], "", "")}</p>
      <p className="mt-4 text-sm">OpenBible.info · CC BY 4.0</p>
      <ul className="mt-6 space-y-2 text-sm text-muted">
        {portadasDeRetos().map((portada) => <li key={portada.id}>{portada.titulo[ui]} · {portada.autor[ui]} · {portada.ubicacion[ui]} · {portada.licencia}</li>)}
        {obrasVisibles().slice(0, 16).map((obra) => <li key={obra.id}>{obra.placa[ui]}</li>)}
      </ul>
    </main>
  );
}
