/** Candado de cuenta de La sala (seguro para el cliente): tipos y vista. No importa textos narrativos; esos viven en un módulo solo de servidor. */
import { hrefEntrarParaSala } from "@audite/domain";

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
export function vistaSala(sesion: SesionMinima): VistaSala {
  return sesion && sesion.userId ? "recorrido" : "adelanto";
}

/** Ruta de La sala: `/{lang}/sala` para el piloto y `/{lang}/sala/{id}` para el resto. */
export function rutaSala(lang: Idioma, id: string): string {
  return id === SALA_POR_DEFECTO ? `/${lang}/sala` : `/${lang}/sala/${id}`;
}

/** Vista según la sesión y enlace de entrada con `?next=` seguro. Nunca resuelve textos narrativos. */
export function datosVistaSala(sesion: SesionMinima, id: string, lang: Idioma) {
  return { vista: vistaSala(sesion), hrefEntrar: hrefEntrarParaSala(lang, rutaSala(lang, id)) } as const;
}
