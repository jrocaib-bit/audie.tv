import type { Metadata } from "next";
import { loadAppCatalog } from "@audite/content/app-catalog";
import { esPortadaProvisional, obrasVisibles } from "@audite/content/obras";
import { portadasDeRetos } from "@audite/content/obras-creditos";
import { creditoVisible } from "@audite/domain";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  return { title: lang === "en" ? "Credits" : "Créditos" };
}

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const ui = lang === "en" ? "en" : "es";
  const libros = loadAppCatalog().books;
  const obras = obrasVisibles();
  return (
    <main className="mx-auto min-h-full w-full max-w-3xl bg-[#100E0C] px-6 py-16 text-[#F4ECE2]">
      <h1 className="font-display t-h1">{ui === "en" ? "Credits" : "Créditos"}</h1>
      <p className="mt-4 max-w-xl text-sm text-[#B7AB9C]">{ui === "en" ? "Biblical text and artworks are credited here, not on each episode." : "El texto bíblico y las obras se acreditan aquí, no en cada episodio."}</p>
      <p className="mt-4 text-sm">{creditoVisible(loadAppCatalog().fuenteTexto[ui], "", "")}</p>
      <p className="mt-4 text-sm">OpenBible.info · CC BY 4.0</p>
      <ul className="mt-6 space-y-2 text-sm text-[#B7AB9C]">
        {portadasDeRetos().map((portada) => <li key={portada.id}>{[portada.titulo[ui], portada.autor[ui], portada.ubicacion[ui], portada.licencia].filter(Boolean).join(" · ")}</li>)}
      </ul>
      {libros.map((libro) => {
        const delLibro = obras.filter((obra) => obra.libro === libro.id && !esPortadaProvisional(obra.episodio)).sort((a, b) => a.numero - b.numero);
        if (delLibro.length === 0) return null;
        return (
          <section key={libro.id} className="mt-8">
            <h2 className="font-display text-2xl">{libro.name[ui] || libro.name.es}</h2>
            <ul className="mt-3 space-y-2 text-sm text-[#B7AB9C]">
              {delLibro.map((obra) => {
                const partes = [obra.placa[ui], obra.licencia, obra.fecha.trim(), obra.ubicacion[ui].trim()].filter(Boolean);
                return (
                  <li key={obra.id}>
                    {partes.join(" · ")}
                    {obra.fuente_url ? <> · <a href={obra.fuente_url} className="underline" rel="noreferrer">{ui === "en" ? "Source" : "Fuente"}</a></> : null}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </main>
  );
}
