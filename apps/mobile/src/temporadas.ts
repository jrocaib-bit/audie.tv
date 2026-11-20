import { adviento1, bautismoDelSenor, miercolesCeniza, pascua, pentecostes } from "@audite/domain";
import { obraDeEpisodio, obraWebp } from "../../../packages/content/src/obras-visibles";
import { PROFECIAS_ID, RETOS_APP, type Paso, type RetoJson } from "./retos-app";
import { CAMINOS, idsDeCamino, portadaDeCamino, progresoCamino, type Rango } from "./caminos";

type Idioma = "es" | "en";

export const CICLO = 2026;
const RETOS: RetoJson[] = RETOS_APP;
export const ADVIENTO_ID = "adviento-isaias";
const ADVIENTO_SRC = "/obras/reto-adviento_o2-1x1.webp";

function sumar(iso: string, dias: number): string {
  const [a, m, d] = iso.split("-").map(Number);
  const f = new Date(Date.UTC(a ?? 1970, (m ?? 1) - 1, d ?? 1));
  f.setUTCDate(f.getUTCDate() + dias);
  return f.toISOString().slice(0, 10);
}

/** Ventana litúrgica de cada reto en el ciclo que empieza en `ciclo` (Adviento de ese año). */
export function ventanaDeReto(id: string, ciclo = CICLO): { inicio: string; fin: string } {
  const sig = ciclo + 1;
  const pascuaSig = pascua(sig);
  switch (id) {
    case "adviento-isaias":
      return { inicio: adviento1(ciclo), fin: `${ciclo}-12-24` };
    case "navidad-infancia":
    case "maria":
      return { inicio: `${ciclo}-12-25`, fin: bautismoDelSenor(sig) };
    case "ordinario-evangelio":
      return { inicio: sumar(bautismoDelSenor(sig), 1), fin: sumar(miercolesCeniza(sig), -1) };
    case "cuaresma-40":
      return { inicio: miercolesCeniza(sig), fin: sumar(pascuaSig, -8) };
    case PROFECIAS_ID:
      return { inicio: "2027-03-21", fin: "2027-03-28" };
    case "semana-santa-pasion":
      return { inicio: sumar(pascuaSig, -7), fin: sumar(pascuaSig, -1) };
    case "pascua-hechos":
      return { inicio: pascuaSig, fin: pentecostes(sig) };
    case "pentecostes":
      return { inicio: sumar(pentecostes(sig), -6), fin: pentecostes(sig) };
    default:
      // Salmos, Sabiduría y Pablo: el tiempo ordinario largo, de Pentecostés al Adviento siguiente.
      return { inicio: sumar(pentecostes(sig), 1), fin: sumar(adviento1(sig), -1) };
  }
}

const MESES: Record<Idioma, string[]> = {
  es: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};

export function fechaCorta(iso: string, lang: Idioma): string {
  const [, m, d] = iso.split("-").map(Number);
  const mes = MESES[lang][(m ?? 1) - 1] ?? "";
  return lang === "en" ? `${mes} ${d}` : `${d} ${mes}`;
}

export function rangoFechas(v: { inicio: string; fin: string }, lang: Idioma): string {
  return `${fechaCorta(v.inicio, lang)} – ${fechaCorta(v.fin, lang)}`;
}

export type EstadoReto = "en-curso" | "empieza" | "terminado";

export function estadoDeReto(v: { inicio: string; fin: string }, hoy: string): EstadoReto {
  if (hoy < v.inicio) return "empieza";
  if (hoy > v.fin) return "terminado";
  return "en-curso";
}

export type TarjetaReto = {
  id: string;
  titulo: string;
  src: string;
  hechos: number;
  total: number;
  fraccion: number;
  estado: EstadoReto;
  fechas: string;
  inicio: string;
  destacado: boolean;
  siguiente: string | null;
  /** Sin pintura todavía: se pinta una placa de marca. */
  sinObra: boolean;
};

export type ModeloRetos = {
  principal: { hechos: number; total: number; fraccion: number; src: string; siguiente: string | null };
  temporadas: TarjetaReto[];
};

type Avance = { episodes: Record<string, { completed: boolean } | undefined> };

export function pasosDeReto(id: string): Paso[] {
  return RETOS.find((r) => r.id === id)?.pasos ?? [];
}

export function datosDeReto(id: string) {
  return RETOS.find((r) => r.id === id) ?? null;
}

function srcDeEpisodio(ep: string): string {
  const obra = obraDeEpisodio(ep);
  return obra ? obraWebp(obra) : "";
}

/** Una obra por tarjeta: si la del reto ya salió, se toma la de alguno de sus días. */
function portadasSinRepetir(ocupadas: Set<string>): Map<string, string> {
  const salida = new Map<string, string>();
  for (const reto of RETOS) {
    if (reto.id === ADVIENTO_ID) {
      salida.set(reto.id, ADVIENTO_SRC);
      ocupadas.add(ADVIENTO_SRC);
      continue;
    }
    if (reto.sinObra) continue;
    const candidatas = [reto.obra, ...reto.pasos.map((p) => p.obra ?? "")].filter(Boolean).map(srcDeEpisodio).filter(Boolean);
    const libre = candidatas.find((src) => !ocupadas.has(src));
    if (libre) {
      salida.set(reto.id, libre);
      ocupadas.add(libre);
    }
  }
  return salida;
}

export function modeloRetos(ctx: { lang: Idioma; hoyIso: string; progress: Avance; rangos: readonly Rango[] }): ModeloRetos {
  const biblia = CAMINOS[0]!;
  const ids = idsDeCamino(biblia, ctx.rangos);
  const avance = progresoCamino(ids, ctx.progress);
  const srcPrincipal = portadaDeCamino(biblia);
  const ocupadas = new Set<string>([srcPrincipal]);
  const portadas = portadasSinRepetir(ocupadas);
  const temporadas = RETOS.map((reto): TarjetaReto => {
    const v = ventanaDeReto(reto.id);
    const episodios = reto.pasos.map((p) => p.episodio).filter((id): id is string => Boolean(id));
    const hechos = episodios.filter((id) => ctx.progress.episodes[id]?.completed).length;
    return {
      id: reto.id,
      titulo: (reto.tituloCorto ?? reto.titulo)[ctx.lang],
      src: portadas.get(reto.id) ?? "",
      hechos,
      total: reto.pasos.length,
      fraccion: reto.pasos.length ? hechos / reto.pasos.length : 0,
      estado: estadoDeReto(v, ctx.hoyIso),
      fechas: rangoFechas(v, ctx.lang),
      inicio: v.inicio,
      destacado: reto.id === ADVIENTO_ID,
      siguiente: episodios.find((id) => !ctx.progress.episodes[id]?.completed) ?? null,
      sinObra: Boolean(reto.sinObra),
    };
  }).sort((a, b) => a.inicio.localeCompare(b.inicio));
  return {
    principal: { hechos: avance.hechos, total: avance.total, fraccion: avance.fraccion, src: srcPrincipal, siguiente: avance.siguiente },
    temporadas,
  };
}
