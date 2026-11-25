/**
 * Preferencias de la pestaña Hoy: qué bloques y tarjetas se ven y en qué orden.
 * Se guardan solo en el dispositivo (AsyncStorage) con la clave CLAVE_PREFERENCIAS_HOY.
 * Módulo puro: parseo tolerante, valor por defecto y operaciones para el modo Editar Hoy.
 */

export const CLAVE_PREFERENCIAS_HOY = "audite.hoy.preferencias.v1";

/** Bloques estables de Hoy, en su orden por defecto. */
export const BLOQUES_HOY = ["camino", "en-curso", "continuar", "historias"] as const;
export type BloqueHoy = (typeof BLOQUES_HOY)[number];

export type ListaOrdenada = { orden: string[]; ocultos: string[] };

export type PreferenciasHoy = {
  version: 1;
  /** Bloques estables (BLOQUES_HOY). */
  bloques: ListaOrdenada;
  /** Tarjetas de lo empezado: `libro:<slug>` y `reto:<id>`. */
  tarjetas: ListaOrdenada;
};

export const LISTA_VACIA: ListaOrdenada = { orden: [], ocultos: [] };
export const PREFERENCIAS_INICIALES: PreferenciasHoy = { version: 1, bloques: LISTA_VACIA, tarjetas: LISTA_VACIA };

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

/** Acepta el texto guardado o el objeto ya leído. Lo que no encaja cae al valor por defecto. */
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
  if (d.version !== 1) return PREFERENCIAS_INICIALES;
  return { version: 1, bloques: lista(d.bloques), tarjetas: lista(d.tarjetas) };
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
export function ordenar<T extends string>(disponibles: readonly T[], lista: ListaOrdenada): T[] {
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
export function mover(disponibles: readonly string[], lista: ListaOrdenada, id: string, delta: -1 | 1): ListaOrdenada {
  const orden: string[] = ordenar(disponibles, lista);
  const i = orden.indexOf(id);
  const j = i + delta;
  if (i < 0 || j < 0 || j >= orden.length) return lista;
  [orden[i], orden[j]] = [orden[j]!, orden[i]!];
  const resto = lista.orden.filter((x) => !orden.includes(x));
  return { ...lista, orden: [...orden, ...resto] };
}

/** Si un elemento puede subir o bajar. */
export function puedeMover(disponibles: readonly string[], lista: ListaOrdenada, id: string): { subir: boolean; bajar: boolean } {
  const orden = ordenar(disponibles, lista);
  const i = orden.indexOf(id);
  return { subir: i > 0, bajar: i >= 0 && i < orden.length - 1 };
}
