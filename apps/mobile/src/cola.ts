import { CAMINOS, idsDeCamino, type Rango } from "./caminos";

type Idioma = "es" | "en";

/** Desde dónde se lanzó la escucha. Manda el orden de «siguiente» y «anterior». */
export type ContextoCola = {
  tipo: "reto" | "camino" | "libro";
  id: string;
  /** Lista explícita (si no, se deduce del tipo). */
  ids?: string[];
  /** Posición en la cola: un reto repite episodios, así que el id no basta. */
  pos?: number;
};

export type FuentesCola = {
  rangos: readonly Rango[];
  /** Episodios de los pasos de un reto, en orden y con repeticiones. */
  pasosReto: (id: string) => string[];
};

export const CLAVE_COLA = "audite.cola.v1";
export const CONTEXTO_DEFECTO: ContextoCola = { tipo: "camino", id: "biblia" };

export function parseContexto(valor: unknown, defecto: ContextoCola = CONTEXTO_DEFECTO): ContextoCola {
  if (!valor || typeof valor !== "object") return defecto;
  const r = valor as Record<string, unknown>;
  const tipo = r.tipo === "reto" || r.tipo === "camino" || r.tipo === "libro" ? r.tipo : null;
  if (!tipo || typeof r.id !== "string" || !/^[a-z0-9-]{1,40}$/.test(r.id)) return defecto;
  const ids = Array.isArray(r.ids) ? r.ids.filter((x): x is string => typeof x === "string" && /^[a-z0-9-]{1,24}$/.test(x)) : undefined;
  const pos = typeof r.pos === "number" && Number.isInteger(r.pos) && r.pos >= 0 ? r.pos : undefined;
  return { tipo, id: r.id, ...(ids && ids.length > 0 ? { ids } : {}), ...(pos !== undefined ? { pos } : {}) };
}

/** Cola de episodios del contexto. Los pasos de un reto se conservan uno a uno. */
export function construirCola(ctx: ContextoCola, f: FuentesCola): string[] {
  if (ctx.ids && ctx.ids.length > 0) return ctx.ids;
  if (ctx.tipo === "reto") return f.pasosReto(ctx.id);
  if (ctx.tipo === "camino") {
    const def = CAMINOS.find((c) => c.id === ctx.id) ?? CAMINOS[0]!;
    return idsDeCamino(def, f.rangos);
  }
  return f.rangos.filter((r) => r.bookId === ctx.id).map((r) => r.id);
}

/** Posición del episodio en la cola, empezando a buscar en `pista`. */
export function posicionEn(cola: readonly string[], id: string, pista = 0): number {
  if (cola[pista] === id) return pista;
  const despues = cola.indexOf(id, Math.max(0, pista));
  return despues >= 0 ? despues : cola.indexOf(id);
}

type Disponible = (id: string) => boolean;

/**
 * Siguiente (dir 1) o anterior (dir -1) con audio. Salta «Próximamente» y no repite
 * el episodio actual dos veces seguidas (los pasos de un reto lo repiten).
 */
export function vecino(cola: readonly string[], pos: number, dir: 1 | -1, grabado: Disponible): { pos: number; id: string } | null {
  const actual = cola[pos];
  for (let i = pos + dir; i >= 0 && i < cola.length; i += dir) {
    const id = cola[i]!;
    if (id === actual || !grabado(id)) continue;
    return { pos: i, id };
  }
  return null;
}

/** Hasta `cuantos` siguientes con audio, para la ventana nativa. */
export function siguientes(cola: readonly string[], pos: number, grabado: Disponible, cuantos: number): { pos: number; id: string }[] {
  const salida: { pos: number; id: string }[] = [];
  let p = pos;
  for (let i = 0; i < cuantos; i += 1) {
    const v = vecino(cola, p, 1, grabado);
    if (!v) break;
    salida.push(v);
    p = v.pos;
  }
  return salida;
}

/** Orden de la ventana nativa: [anterior?, actual, siguientes…]. */
export function planVentana(cola: readonly string[], pos: number, grabado: Disponible, cuantosSiguientes = 2): { anterior: { pos: number; id: string } | null; actual: { pos: number; id: string }; siguientes: { pos: number; id: string }[] } {
  return {
    anterior: vecino(cola, pos, -1, grabado),
    actual: { pos, id: cola[pos] ?? "" },
    siguientes: siguientes(cola, pos, grabado, cuantosSiguientes),
  };
}

export type InfoPaso = { paso: number; total: number; faltan: number; hechos: number; fraccion: number };

export function infoPaso(cola: readonly string[], pos: number, completado: (id: string) => boolean): InfoPaso {
  const total = cola.length;
  const paso = Math.min(Math.max(pos, 0), Math.max(total - 1, 0)) + 1;
  const hechos = cola.filter((id) => completado(id)).length;
  return { paso, total, faltan: Math.max(total - paso, 0), hechos, fraccion: total === 0 ? 0 : hechos / total };
}

export type NombresCola = { libro: (id: string) => string | undefined; reto: (id: string) => { es: string; en: string } | undefined };

export function nombreContexto(ctx: ContextoCola, lang: Idioma, n: NombresCola): string {
  if (ctx.tipo === "camino") {
    if (ctx.id === "biblia") return lang === "en" ? "Whole Bible" : "Biblia entera";
    return (CAMINOS.find((c) => c.id === ctx.id) ?? CAMINOS[0]!).nombre[lang];
  }
  if (ctx.tipo === "reto") {
    if (ctx.id === "adviento-isaias") return lang === "en" ? "Advent challenge" : "Reto de Adviento";
    const t = n.reto(ctx.id)?.[lang] ?? ctx.id;
    return lang === "en" ? `Challenge · ${t}` : `Reto · ${t}`;
  }
  return n.libro(ctx.id) ?? ctx.id;
}

/** «Biblia entera · paso 291 de 516 · faltan 225». `palabra` fuerza «paso» (pantalla de bloqueo). */
export function textoContexto(ctx: ContextoCola, info: InfoPaso, lang: Idioma, n: NombresCola, opciones: { faltan?: boolean; palabra?: "paso" } = {}): string {
  const nombre = nombreContexto(ctx, lang, n);
  let palabra: string;
  if (opciones.palabra === "paso" || ctx.tipo === "camino") palabra = lang === "en" ? "step" : "paso";
  else if (ctx.tipo === "reto") palabra = lang === "en" ? "day" : "día";
  else palabra = lang === "en" ? "episode" : "episodio";
  const base = lang === "en" ? `${nombre} · ${palabra} ${info.paso} of ${info.total}` : `${nombre} · ${palabra} ${info.paso} de ${info.total}`;
  if (!opciones.faltan) return base;
  return lang === "en" ? `${base} · ${info.faltan} to go` : `${base} · faltan ${info.faltan}`;
}
