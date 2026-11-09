import type { Metadata } from "next";
import { COLOR_HEX, type TiempoId } from "@audite/domain";
import { obraDeEpisodio, obraWebp, obrasVisibles } from "@audite/content/obras";
import { notFound } from "next/navigation";
import { RETOS } from "@/lib/retos";

const SLUGS: Record<string, TiempoId> = {
  adviento: "adviento",
  advent: "adviento",
  navidad: "navidad",
  christmas: "navidad",
  cuaresma: "cuaresma",
  lent: "cuaresma",
  pascua: "pascua",
  easter: "pascua",
  ordinario: "ordinario",
  ordinary: "ordinario",
  "semana-santa": "semana-santa",
  "holy-week": "semana-santa",
};

const NOMBRES: Record<TiempoId, { es: string; en: string }> = {
  adviento: { es: "Adviento", en: "Advent" },
  navidad: { es: "Navidad", en: "Christmas" },
  ordinario: { es: "Tiempo ordinario", en: "Ordinary Time" },
  cuaresma: { es: "Cuaresma", en: "Lent" },
  "semana-santa": { es: "Semana Santa", en: "Holy Week" },
  triduo: { es: "Triduo", en: "Triduum" },
  pascua: { es: "Pascua", en: "Easter" },
};

export async function generateMetadata({ params }: { params: Promise<{ lang: string; tiempo: string }> }): Promise<Metadata> {
  const { tiempo, lang } = await params;
  const id = SLUGS[tiempo];
  if (!id) return { title: "Audite" };
  const ui = lang === "en" ? "en" : "es";
  return { title: NOMBRES[id][ui], description: NOMBRES[id][ui] };
}

export default async function Page({ params }: { params: Promise<{ lang: string; tiempo: string }> }) {
  const { lang, tiempo } = await params;
  const id = SLUGS[tiempo];
  if (!id) notFound();
  const ui = lang === "en" ? "en" : "es";
  const reto = RETOS.find((item) => item.tiempo === id);
  const obra = obrasVisibles().find((item) => item.episodio === reto?.pasos[0]?.obra) ?? obraDeEpisodio("gn-01");
  const color = id === "adviento" || id === "cuaresma" ? COLOR_HEX.morado : id === "pascua" ? COLOR_HEX.blanco : id === "semana-santa" ? COLOR_HEX.rojo : id === "navidad" ? COLOR_HEX.blanco : COLOR_HEX.verde;
  return (
    <main className="min-h-full bg-[#100E0C] text-[#F4ECE2]">
      <div className="relative h-72 overflow-hidden" style={{ background: color }}>
        {obra ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={obraWebp(obra)} alt="" className="h-full w-full object-cover" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-[#100E0C] via-[#100E0C]/25 to-transparent" />
        <span className="absolute inset-x-0 top-0 h-1.5" style={{ background: color }} />
        <h1 className="font-display absolute right-5 bottom-5 left-5 text-[clamp(2.2rem,10vw,3.4rem)] leading-none whitespace-nowrap">{NOMBRES[id][ui]}</h1>
      </div>
      <div className="mx-auto flex w-full max-w-lg flex-col gap-3 px-5 py-6">
        {reto ? <p className="font-display text-3xl leading-none">{reto.titulo[ui]}</p> : null}
        {reto ? <p className="text-lg">{reto.pasos.length} {ui === "en" ? "days" : "días"} · {reto.pasos[0]?.cita}</p> : null}
        <a href={`audite://tiempo/${id}`} className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#C9A96E] text-[#100E0C]">{ui === "en" ? "Open in the app" : "Abrir en la app"}</a>
      </div>
    </main>
  );
}
