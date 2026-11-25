/**
 * Preferencias de la pestaña Hoy: qué bloques y tarjetas se ven y en qué orden.
 * Se guardan solo en el dispositivo (AsyncStorage) con la clave CLAVE_PREFERENCIAS_HOY.
 * Módulo puro: parseo tolerante, valor por defecto y operaciones para el modo Editar Hoy.
 *
 * Bloques: se ocultan y se muestran. Tarjetas de lo empezado: se quitan de Hoy con la huella del avance
 * de ese momento, y vuelven solas cuando el avance real cambia después (ver hoy-empezados.ts).
 * Tarjetas fijadas: van primero en «En curso», en el orden en que se fijaron. Quitar una tarjeta la desfija.
 * Versión 3 del contenido. La clave conserva el sufijo v1 y el parseo sigue leyendo las versiones 1 y 2:
 * las tarjetas ocultas de la versión 1 pasan a quitadas sin huella y las dos llegan sin fijados.
 */

export const CLAVE_PREFERENCIAS_HOY = "audite.hoy.preferencias.v1";

/** Bloques estables de Hoy, en su orden por defecto. */
export const BLOQUES_HOY = ["camino", "en-curso", "continuar", "historias"] as const;
export type BloqueHoy = (typeof BLOQUES_HOY)[number];

export type Orden = { orden: string[] };
export type ListaOrdenada = Orden & { ocultos: string[] };

/** Avance de un libro en el momento de quitarlo de Hoy. */
export type HuellaLibro = { tipo: "libro"; capituloId: string; bloqueId: string | null; ratio: number | null; actualizado: string };
/** Avance de un reto en el momento de quitarlo: pasos hechos y, por episodio, segundos escuchados y si está completado. */
export type HuellaReto = { tipo: "reto"; hechos: number; episodios: Record<string, { s: number; c: boolean }>; actualizado: string };
export type Huella = HuellaLibro | HuellaReto;

/** Tarjeta quitada de Hoy. Sin huella (preferencias de la versión 1) sigue quitada hasta que se vuelva a mostrar. */
export type Quitado = { clave: string; huella: Huella | null; en: string };

export type PreferenciasHoy = {
  version: 3;
  /** Bloques estables (BLOQUES_HOY). */
  bloques: ListaOrdenada;
  /** Orden de las tarjetas de lo empezado: `libro:<slug>` y `reto:<id>`. */
  tarjetas: Orden;
  /** Tarjetas quitadas de Hoy, con la huella del avance de ese momento. */
  quitados: Quitado[];
  /** Tarjetas fijadas arriba de «En curso», en el orden en que se fijaron. */
  fijados: string[];
};

export const LISTA_VACIA: ListaOrdenada = { orden: [], ocultos: [] };
export const PREFERENCIAS_INICIALES: PreferenciasHoy = { version: 3, bloques: LISTA_VACIA, tarjetas: { orden: [] }, quitados: [], fijados: [] };

const MAX_IDS = 200;
const MAX_LARGO = 200;

function ids(valor: unknown): string[] {
  if (!Array.isArray(valor)) return [];
  const salida: string[] = [];
  for (const v of valor) {
    if (typeof v !== "string") continue;
    const id = v.trim();
    if (!id || id.length > MAX_LARGO || salida.includes(id)) continue;
    salida.push(id);
    if (salida.length >= MAX_IDS) break;
  }
  return salida;
}

function lista(valor: unknown): ListaOrdenada {
  const dato = valor && typeof valor === "object" && !Array.isArray(valor) ? (valor as Record<string, unknown>) : {};
  return { orden: ids(dato.orden), ocultos: ids(dato.ocultos) };
}

function objeto(valor: unknown): Record<string, unknown> | null {
  return valor && typeof valor === "object" && !Array.isArray(valor) ? (valor as Record<string, unknown>) : null;
}

function texto(valor: unknown): string {
  return typeof valor === "string" && valor.length <= MAX_LARGO ? valor : "";
}

function numero(valor: unknown): number | null {
  return typeof valor === "number" && Number.isFinite(valor) ? valor : null;
}

/** Huella guardada, o null si no encaja. */
export function parseHuella(valor: unknown): Huella | null {
  const d = objeto(valor);
  if (!d) return null;
  if (d.tipo === "libro") {
    const capituloId = texto(d.capituloId);
    if (!capituloId) return null;
    return { tipo: "libro", capituloId, bloqueId: texto(d.bloqueId) || null, ratio: numero(d.ratio), actualizado: texto(d.actualizado) };
  }
  if (d.tipo === "reto") {
    const hechos = numero(d.hechos);
    if (hechos === null || hechos < 0) return null;
    const episodios: HuellaReto["episodios"] = {};
    for (const [id, e] of Object.entries(objeto(d.episodios) ?? {}).slice(0, MAX_IDS)) {
      const ep = objeto(e);
      if (!ep || !id || id.length > MAX_LARGO) continue;
      episodios[id] = { s: Math.max(0, numero(ep.s) ?? 0), c: ep.c === true };
    }
    return { tipo: "reto", hechos, episodios, actualizado: texto(d.actualizado) };
  }
  return null;
}

function quitados(valor: unknown): Quitado[] {
  if (!Array.isArray(valor)) return [];
  const salida: Quitado[] = [];
  for (const v of valor) {
    const d = objeto(v);
    const clave = d ? texto(d.clave).trim() : "";
    if (!d || !clave || salida.some((q) => q.clave === clave)) continue;
    salida.push({ clave, huella: parseHuella(d.huella), en: texto(d.en) });
    if (salida.length >= MAX_IDS) break;
  }
  return salida;
}

/**
 * Acepta el texto guardado o el objeto ya leído, de las versiones 1, 2 o 3, y devuelve siempre la versión 3.
 * Lo que no encaja cae al valor por defecto. Las tarjetas ocultas de la versión 1 pasan a quitadas sin huella.
 * Las versiones 1 y 2 llegan sin fijados. Un fijado que también está quitado se lee desfijado.
 */
export function parsePreferenciasHoy(bruto: unknown): PreferenciasHoy {
  let dato: unknown = bruto;
  if (typeof bruto === "string") {
    try {
      dato = JSON.parse(bruto);
    } catch {
      return PREFERENCIAS_INICIALES;
    }
  }
  if (!dato || typeof dato !== "object" || Array.isArray(dato)) return PREFERENCIAS_INICIALES;
  const d = dato as Record<string, unknown>;
  if (d.version === 1) {
    const tarjetas = lista(d.tarjetas);
    return { version: 3, bloques: lista(d.bloques), tarjetas: { orden: tarjetas.orden }, quitados: tarjetas.ocultos.map((clave) => ({ clave, huella: null, en: "" })), fijados: [] };
  }
  if (d.version !== 2 && d.version !== 3) return PREFERENCIAS_INICIALES;
  const q = quitados(d.quitados);
  const fijados = d.version === 3 ? ids(d.fijados).filter((clave) => !q.some((x) => x.clave === clave)) : [];
  return { version: 3, bloques: lista(d.bloques), tarjetas: { orden: ids(objeto(d.tarjetas)?.orden) }, quitados: q, fijados };
}

export function serializarPreferenciasHoy(p: PreferenciasHoy): string {
  return JSON.stringify(p);
}

/** Grupo de un identificador: `libro`, `reto` o el propio bloque. */
export function grupoDe(id: string): string {
  const i = id.indexOf(":");
  return i < 0 ? id : id.slice(0, i);
}

/**
 * Orden completo (visibles y ocultos) de lo disponible. Lo que el usuario ya ordenó mantiene su sitio.
 * Lo nuevo entra detrás del último de su grupo o, si su grupo no aparece, al final.
 */
export function ordenar<T extends string>(disponibles: readonly T[], lista: Orden): T[] {
  const hay = new Set<string>(disponibles);
  const salida = lista.orden.filter((id, i): id is T => hay.has(id) && lista.orden.indexOf(id) === i);
  for (const id of disponibles) {
    if (salida.includes(id)) continue;
    const grupo = grupoDe(id);
    let ultimo = -1;
    salida.forEach((otro, i) => {
      if (grupoDe(otro) === grupo) ultimo = i;
    });
    if (ultimo < 0) salida.push(id);
    else salida.splice(ultimo + 1, 0, id);
  }
  return salida;
}

/** Lo que se pinta, en orden. Ocultar no borra nada: solo deja de pintarse. */
export function visibles<T extends string>(disponibles: readonly T[], lista: ListaOrdenada): T[] {
  const ocultos = new Set(lista.ocultos);
  return ordenar(disponibles, lista).filter((id) => !ocultos.has(id));
}

export function estaOculto(lista: ListaOrdenada, id: string): boolean {
  return lista.ocultos.includes(id);
}

/** Muestra u oculta un elemento. */
export function alternarVisible(lista: ListaOrdenada, id: string): ListaOrdenada {
  return estaOculto(lista, id) ? { ...lista, ocultos: lista.ocultos.filter((x) => x !== id) } : { ...lista, ocultos: [...lista.ocultos, id] };
}

/**
 * Sube (delta -1) o baja (delta 1) un elemento dentro del orden completo de lo disponible.
 * Conserva al final lo que el usuario ordenó y ahora no está disponible (un libro terminado, por ejemplo).
 */
export function mover<L extends Orden>(disponibles: readonly string[], lista: L, id: string, delta: -1 | 1): L {
  const orden: string[] = ordenar(disponibles, lista);
  const i = orden.indexOf(id);
  const j = i + delta;
  if (i < 0 || j < 0 || j >= orden.length) return lista;
  [orden[i], orden[j]] = [orden[j]!, orden[i]!];
  const resto = lista.orden.filter((x) => !orden.includes(x));
  return { ...lista, orden: [...orden, ...resto] };
}

/** Si un elemento puede subir o bajar. */
export function puedeMover(disponibles: readonly string[], lista: Orden, id: string): { subir: boolean; bajar: boolean } {
  const orden = ordenar(disponibles, lista);
  const i = orden.indexOf(id);
  return { subir: i > 0, bajar: i >= 0 && i < orden.length - 1 };
}

/** La entrada de una tarjeta quitada, o undefined si se ve en Hoy. */
export function quitadoDe(p: PreferenciasHoy, clave: string): Quitado | undefined {
  return p.quitados.find((q) => q.clave === clave);
}

/** Quita una tarjeta de Hoy y guarda la huella de su avance. Si estaba fijada, la desfija. El progreso no se toca. */
export function quitar(p: PreferenciasHoy, clave: string, huella: Huella, en: string): PreferenciasHoy {
  const resto = p.quitados.filter((q) => q.clave !== clave);
  return { ...p, quitados: [...resto, { clave, huella, en }].slice(-MAX_IDS), fijados: p.fijados.filter((x) => x !== clave) };
}

export function estaFijado(p: PreferenciasHoy, clave: string): boolean {
  return p.fijados.includes(clave);
}

/** Fija una tarjeta arriba de «En curso», detrás de las que ya estaban fijadas. Si estaba quitada, vuelve a Hoy. */
export function fijar(p: PreferenciasHoy, clave: string): PreferenciasHoy {
  if (estaFijado(p, clave)) return p;
  return { ...p, quitados: p.quitados.filter((q) => q.clave !== clave), fijados: [...p.fijados, clave].slice(-MAX_IDS) };
}

/** Desfija una tarjeta. Vuelve a su sitio en el orden del usuario. */
export function desfijar(p: PreferenciasHoy, clave: string): PreferenciasHoy {
  return estaFijado(p, clave) ? { ...p, fijados: p.fijados.filter((x) => x !== clave) } : p;
}

/**
 * Orden de lo que se ve en «En curso»: primero lo fijado, en el orden en que se fijó, y después el resto
 * en el orden del usuario. Recibe las claves visibles ya ordenadas.
 */
export function fijadosPrimero(claves: readonly string[], p: PreferenciasHoy): string[] {
  const hay = new Set(claves);
  const arriba = p.fijados.filter((x) => hay.has(x));
  return [...arriba, ...claves.filter((x) => !arriba.includes(x))];
}

/** Sube (delta -1) o baja (delta 1) una tarjeta fijada entre las fijadas visibles. */
export function moverFijado(visiblesFijados: readonly string[], p: PreferenciasHoy, clave: string, delta: -1 | 1): PreferenciasHoy {
  const orden = p.fijados.filter((x) => visiblesFijados.includes(x));
  const i = orden.indexOf(clave);
  const j = i + delta;
  if (i < 0 || j < 0 || j >= orden.length) return p;
  [orden[i], orden[j]] = [orden[j]!, orden[i]!];
  return { ...p, fijados: [...orden, ...p.fijados.filter((x) => !orden.includes(x))] };
}

/** Vuelve a mostrar una tarjeta quitada. */
export function volverAMostrar(p: PreferenciasHoy, clave: string): PreferenciasHoy {
  return { ...p, quitados: p.quitados.filter((q) => q.clave !== clave) };
}
