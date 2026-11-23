/** Candado de cuenta de La sala (función pura): los recorridos y textos solo se ven con sesión iniciada. */
import { hrefEntrarParaSala } from "@audite/domain";
import datos from "@/datos/recorridos-sala.json";

export type SesionMinima = { userId: string } | null | undefined;
export type VistaSala = "recorrido" | "adelanto";
type Idioma = "es" | "en";
type Bilingue = { es: string; en: string };
export type PasoSala = { x: number; y: number; zoom: number; titulo: Bilingue; texto: Bilingue };
export type RecorridoSala = { apertura: { titulo: Bilingue; texto: Bilingue }; pasos: PasoSala[]; cierre: { titulo: Bilingue; texto: Bilingue } };
/** Recorrido ya resuelto a un idioma. */
export type RecorridoVista = {
  apertura: { titulo: string; texto: string };
  pasos: { x: number; y: number; zoom: number; titulo: string; texto: string }[];
  cierre: { titulo: string; texto: string };
};

export const SALA_POR_DEFECTO = "gn-01";
const RECORRIDOS = datos as Record<string, RecorridoSala>;

export function idsSala(): string[] {
  return Object.keys(RECORRIDOS);
}

export function recorridoSala(id: string): RecorridoSala | null {
  return Object.prototype.hasOwnProperty.call(RECORRIDOS, id) ? RECORRIDOS[id]! : null;
}

export function vistaSala(sesion: SesionMinima): VistaSala {
  return sesion && sesion.userId ? "recorrido" : "adelanto";
}

/** Ruta de La sala: `/{lang}/sala` para el piloto y `/{lang}/sala/{id}` para el resto. */
export function rutaSala(lang: Idioma, id: string): string {
  return id === SALA_POR_DEFECTO ? `/${lang}/sala` : `/${lang}/sala/${id}`;
}

export function resolverRecorrido(id: string, lang: Idioma): RecorridoVista | null {
  const r = recorridoSala(id);
  if (!r) return null;
  return {
    apertura: { titulo: r.apertura.titulo[lang], texto: r.apertura.texto[lang] },
    pasos: r.pasos.map((p) => ({ x: p.x, y: p.y, zoom: p.zoom, titulo: p.titulo[lang], texto: p.texto[lang] })),
    cierre: { titulo: r.cierre.titulo[lang], texto: r.cierre.texto[lang] },
  };
}

/**
 * Qué se muestra según la sesión. Sin sesión: solo título y enlace de entrada con `?next=` seguro
 * (sin apertura, pasos ni cierre). Con sesión: el recorrido completo.
 */
export function datosVistaSala(sesion: SesionMinima, id: string, lang: Idioma) {
  const vista = vistaSala(sesion);
  const hrefEntrar = hrefEntrarParaSala(lang, rutaSala(lang, id));
  if (vista === "adelanto") return { vista, hrefEntrar, recorrido: null } as const;
  return { vista, hrefEntrar, recorrido: resolverRecorrido(id, lang) } as const;
}
