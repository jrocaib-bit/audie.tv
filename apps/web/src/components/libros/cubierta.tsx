import Link from "next/link";
import { MENSAJES_LIBROS, type LibroFicha, type RecomendacionLibro } from "@audite/domain";

const TONOS = ["#3C2A1E", "#243028", "#4A3424", "#2A241C", "#3A2C22", "#1E2A32"] as const;
const ROMANOS = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI"];

export function romano(n: number): string {
  return ROMANOS[n] ?? String(n);
}

/** Cubierta tipográfica: número de volumen y título. No hay arte ni se inventa ninguno. */
export function Cubierta({ volumen, titulo, libroBiblico, compacta = false, compactaMovil = false }: { volumen: number; titulo: string; libroBiblico?: string; compacta?: boolean; compactaMovil?: boolean }) {
  // compactaMovil: tipografía compacta solo por debajo de md (ficha con la portada a la izquierda).
  const m = compactaMovil && !compacta
  const tono = TONOS[(volumen - 1 + TONOS.length) % TONOS.length] ?? TONOS[0];
  return (
    <div
      data-cubierta=""
      className="relative flex aspect-[2/3] w-full flex-col justify-between overflow-hidden rounded-[4px] border border-[#C9A96E]/35 p-[9%] text-[#F4ECE2] shadow-[0_18px_40px_-24px_rgba(0,0,0,0.9)]"
      style={{ background: `linear-gradient(160deg, ${tono} 0%, #100E0C 120%)` }}
    >
      <p className={`${compacta ? "text-[9px]" : m ? "text-[9px] md:text-xs" : "text-xs"} tracking-[0.22em] text-[#C9A96E] uppercase`}>Volumen {romano(volumen)}</p>
      <div>
        <span aria-hidden="true" className="mb-[6%] block h-px w-[22%] bg-[#C9A96E]/70" />
        <p className={`font-display ${compacta ? "text-[15px] leading-[1.1]" : m ? "text-[15px] leading-[1.1] md:text-[clamp(1.5rem,3.2vw,2rem)] md:leading-[1.05]" : "text-[clamp(1.5rem,3.2vw,2rem)] leading-[1.05]"}`}>{titulo}</p>
      </div>
      <p className={`${compacta ? "text-[8px]" : m ? "text-[8px] md:text-[11px]" : "text-[11px]"} tracking-[0.18em] text-[#B7AB9C] uppercase`}>{libroBiblico ? `${libroBiblico} · Audite` : "Audite"}</p>
    </div>
  );
}

export function EtiquetaEstado({ ficha }: { ficha: Pick<LibroFicha, "disponibilidad"> }) {
  if (ficha.disponibilidad === "borrador") return <span className="text-sm text-[#8A8175]">{MENSAJES_LIBROS.enPreparacion}</span>;
  if (ficha.disponibilidad === "preparandose") return <span className="text-sm text-[#B7AB9C]">Lectura en preparación</span>;
  return <span className="text-sm text-[#C9A96E]">Adelanto gratis</span>;
}

export function TarjetaLibro({ lang, ficha }: { lang: string; ficha: LibroFicha }) {
  const enlace = ficha.disponibilidad !== "borrador";
  const contenido = (
    <>
      <Cubierta volumen={ficha.volumen} titulo={ficha.titulo} libroBiblico={ficha.libro_biblico} />
      <div className="mt-4 grid gap-1">
        <h2 className="font-display text-2xl leading-tight">{ficha.titulo}</h2>
        <p className="text-sm text-[#B7AB9C]">{ficha.subtitulo}</p>
        <p className="mt-1"><EtiquetaEstado ficha={ficha} /></p>
      </div>
    </>
  );
  return (
    <li data-libro={ficha.id} data-estado={ficha.disponibilidad} className="list-none">
      {enlace ? (
        <Link href={`/${lang}/libros/${ficha.slug}`} className="block rounded-[6px] outline-offset-4 transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-[#C9A96E]">{contenido}</Link>
      ) : (
        <div className="opacity-70">{contenido}</div>
      )}
    </li>
  );
}

/** Bloque «Libros que comentan este episodio». Sin hooks: sirve en servidor y en cliente. */
export function ListaLibrosRecomendados({ lang, libros }: { lang: string; libros: RecomendacionLibro[] }) {
  if (libros.length === 0) return null;
  return (
    <section data-libros-episodio="" aria-labelledby="libros-episodio" className="mt-10 border-t border-[#2E2924] pt-8">
      <h2 id="libros-episodio" className="text-sm tracking-[0.16em] text-[#C9A96E] uppercase">Libros que comentan este episodio</h2>
      <ul className="mt-5 grid gap-5">
        {libros.map((libro) => {
          const base = `/${lang}/libros/${libro.id}/leer`;
          const href = libro.capitulo_id && libro.capitulo_id !== "prologo" ? `${base}?c=${libro.capitulo_id}` : base;
          return (
            <li key={libro.id} className="list-none">
              <Link href={href} className="grid grid-cols-[64px_1fr] items-center gap-4 rounded-[6px] outline-offset-4 focus-visible:outline-2 focus-visible:outline-[#C9A96E]" data-libro={libro.id}>
                <Cubierta volumen={libro.volumen} titulo={libro.titulo} compacta />
                <span className="grid gap-1">
                  <span className="font-display text-xl leading-tight">{libro.titulo}</span>
                  <span className="text-sm text-[#B7AB9C]">{libro.subtitulo}</span>
                  <span className="text-sm text-[#C9A96E]">Leer el adelanto</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
