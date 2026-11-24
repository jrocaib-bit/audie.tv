/** Candado de cuenta de La sala (seguro para el cliente): tipos y vista. No importa textos narrativos; esos viven en un módulo solo de servidor. */
import { hrefEntrarParaSala } from "@audite/domain";
import type { ComparativaSala } from "./sala-contexto";

export type SesionMinima = { userId: string } | null | undefined;
/** Tres estados de acceso: sin sesión, cuenta gratuita y premium (suscripción activa o en prueba). */
export type VistaSala = "sin-sesion" | "gratuito" | "premium";
type Idioma = "es" | "en";
type Bilingue = { es: string; en: string };
export type PasoSala = { x: number; y: number; zoom: number; titulo: Bilingue; texto: Bilingue };
export type RecorridoSala = { apertura: { titulo: Bilingue; texto: Bilingue }; pasos: PasoSala[]; cierre: { titulo: Bilingue; texto: Bilingue } };
/** Recorrido ya resuelto a un idioma. */
export type RecorridoVista = {
  apertura: { titulo: string; texto: string };
  /** `radio`: foco de la máscara (fracción del lado menor del visor); opcional, por defecto se deriva del zoom. */
  pasos: { x: number; y: number; zoom: number; radio?: number; titulo: string; texto: string }[];
  cierre: { titulo: string; texto: string };
  /** Material extra solo premium (comparativa); ausente si la obra no lo tiene. */
  comparativa?: ComparativaSala;
};

/** Adelanto público: la apertura resuelta a un idioma. Es lo único que reciben sin sesión y las cuentas gratuitas. */
export type Adelanto = { titulo: string; texto: string };
/** Cuerpo de `GET /api/sala/[id]`: no premium solo lleva la apertura; premium, el recorrido completo. */
export type RespuestaSala = { acceso: "sin-sesion" | "gratuito"; apertura: Adelanto } | ({ acceso: "premium" | "abierta" } & RecorridoVista);

export const SALA_POR_DEFECTO = "gn-01";
/**
 * Sin sesión → "sin-sesion". Con sesión, el estado lo dice el servidor (`acceso`): nunca se asume premium
 * solo porque haya userId; mientras no responde (o si falla) se trata como "gratuito".
 */
export function vistaSala(sesion: SesionMinima, acceso?: VistaSala | null): VistaSala {
  if (!sesion || !sesion.userId) return "sin-sesion";
  return acceso ?? "gratuito";
}

/** Ruta de una obra en La sala. El índice vive en `/{lang}/sala`. */
export function rutaSala(lang: Idioma, id: string): string {
  return `/${lang}/sala/${id}`;
}

/** Vista según la sesión y enlace de entrada con `?next=` seguro. Nunca resuelve textos narrativos. */
export function datosVistaSala(sesion: SesionMinima, id: string, lang: Idioma, acceso?: VistaSala | null) {
  return { vista: vistaSala(sesion, acceso), hrefEntrar: hrefEntrarParaSala(lang, rutaSala(lang, id)) } as const;
}
