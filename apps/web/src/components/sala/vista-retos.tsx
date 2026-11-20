import Link from "next/link";
import { loadAppCatalog } from "@audite/content/app-catalog";
import { obraDeEpisodio } from "@audite/content/obras";
import { copiaSitio } from "@/sitio/i18n";
import { retosDeTemporada } from "@/lib/retos-anio";
import { anioLiturgico, chipDeReto, duracionTramo, estadoDeReto, hoyMadrid, portadasSinRepetir, posicionHoy, retoHeroe } from "@/lib/sala";
import { fechaLegible } from "@/lib/publico";
import { BotonOro } from "./boton-oro";
import { Lienzo } from "./lienzo";
import { Rail } from "./rail";
import { RetoCartel } from "./reto-cartel";
import { obraWebp } from "@audite/content/obras";

function LineaDelAnio({ ui, hoy }: { ui: "es" | "en"; hoy: string }) {
  const tramos = anioLiturgico();
  const posicion = posicionHoy(tramos, hoy);
  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-8 md:px-8" aria-label={ui === "en" ? "Liturgical year" : "Año litúrgico"}>
      <div className="relative">
        <ol className="flex gap-1 overflow-x-auto" data-linea-anio="">
          {tramos.map((tramo) => (
            <li key={tramo.id} style={{ flex: `${duracionTramo(tramo)} 1 5.5rem` }} className="min-w-[5.5rem]">
              <span className="block h-1.5 rounded-full bg-[#2E2924]" />
              <span className="t-meta mt-2 block truncate">{tramo[ui]}</span>
              <span className="t-meta block text-[#8A8175]">{fechaLegible(tramo.inicio, ui)}</span>
            </li>
          ))}
        </ol>
        <span data-hoy="" aria-label={ui === "en" ? "Today" : "Hoy"} className="absolute -top-1 size-3.5 -translate-x-1/2 rounded-full bg-[#E0C48A] ring-2 ring-[#100E0C]" style={{ left: `${(posicion * 100).toFixed(1)}%` }} />
      </div>
    </section>
  );
}

export function VistaRetos({ lang, hoy = hoyMadrid() }: { lang: string; hoy?: string }) {
  const ui = lang === "en" ? "en" : "es";
  const copy = copiaSitio(lang);
  const catalogo = loadAppCatalog();
  const temporada = retosDeTemporada();
  const heroe = retoHeroe(temporada, hoy);
  const bibliaObra = obraDeEpisodio("gn-01");
  const portadas = portadasSinRepetir(heroe ? [heroe, ...temporada.filter((reto) => reto.id !== heroe.id)] : temporada, catalogo.rangos, bibliaObra ? [bibliaObra.id] : []);
  const resto = temporada.filter((reto) => reto.id !== heroe?.id);
  const siguientes = resto.slice(0, 3);
  const cuadricula = resto.slice(3);
  const dias = ui === "en" ? "days" : "días";
  const cartel = (reto: (typeof temporada)[number], extra: { heroe?: boolean; priority?: boolean } = {}) => {
    const portada = portadas.get(reto.id) ?? null;
    return (
      <RetoCartel
        href={`/${lang}/retos/${reto.id}`}
        titulo={reto.titulo[ui]}
        chip={chipDeReto(reto, hoy, ui)}
        meta={`${reto.dias.length} ${dias}`}
        src={portada?.src ?? null}
        obraId={portada?.obraId}
        portadaOficial={portada?.oficial}
        ancho={portada?.ancho}
        dias={reto.dias.length}
        hechos={estadoDeReto(reto, hoy).hechos}
        {...extra}
      />
    );
  };
  return (
    <main className="bg-[#100E0C] text-[#F4ECE2]">
      <div className="mx-auto w-full max-w-6xl px-5 pt-10 md:px-8">
        <h1 className="font-display t-h1">{ui === "en" ? "Challenges" : "Retos"}</h1>
        {heroe ? (
          <div className="mt-6">
            {cartel(heroe, { heroe: true, priority: true })}
            <BotonOro asChild className="mt-4 w-full md:w-auto"><Link href={`/${lang}/retos/${heroe.id}`}>{copy?.ctaAdvent ?? "Empieza el reto"}</Link></BotonOro>
          </div>
        ) : null}
      </div>
      <LineaDelAnio ui={ui} hoy={hoy} />
      {siguientes.length > 0 ? (
        <Rail titulo={ui === "en" ? "Next" : "Siguientes"} cartel>
          {siguientes.map((reto) => <li key={reto.id}>{cartel(reto)}</li>)}
        </Rail>
      ) : null}
      {bibliaObra ? (
        <section className="mx-auto w-full max-w-6xl px-5 py-8 md:px-8">
          <article className="grid overflow-hidden rounded-[28px] bg-[#1B1815] md:grid-cols-2">
            <Lienzo src={obraWebp(bibliaObra)} obraId={bibliaObra.id} className="aspect-[4/3]" />
            <div className="flex flex-col justify-center gap-3 p-6 md:p-10">
              <p className="t-rotulo text-[#B7AB9C]">{ui === "en" ? "The main path" : "El camino principal"}</p>
              <h2 className="font-display t-h1">{ui === "en" ? "The Bible, beginning to end" : "La Biblia de principio a fin"}</h2>
              <p className="font-display t-cifra">{catalogo.rangos.length} <span className="text-xl text-[#B7AB9C]">{ui === "en" ? "episodes" : "episodios"}</span></p>
              <BotonOro asChild variante="secundario" className="mt-2 w-fit"><Link href={`/${lang}/app`}>{ui === "en" ? "Start in the app" : "Empieza en la app"}</Link></BotonOro>
            </div>
          </article>
        </section>
      ) : null}
      {cuadricula.length > 0 ? (
        <section className="mx-auto w-full max-w-6xl px-5 py-8 md:px-8">
          <h2 className="font-display t-h2">{ui === "en" ? "Through the year" : "En el año"}</h2>
          <ul className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3">
            {cuadricula.map((reto) => <li key={reto.id}>{cartel(reto)}</li>)}
          </ul>
        </section>
      ) : null}
      <section className="mx-auto w-full max-w-6xl px-5 py-12 md:px-8">
        <h2 className="font-display t-h2">{ui === "en" ? "Feasts and the sanctoral" : "Fiestas y santoral"}</h2>
        <p className="mt-2 text-[#B7AB9C]">{ui === "en" ? "Coming soon" : "Próximamente"}</p>
      </section>
    </main>
  );
}
