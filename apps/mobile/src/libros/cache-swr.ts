/**
 * Caché persistente con stale-while-revalidate para la sección Libros. Sin React ni React Native:
 * el almacenamiento llega por parámetro (AsyncStorage en la app, un Map en las pruebas).
 *
 * Reglas: la clave lleva versión, cada sobre guarda su hora y se valida al leer. Un dato fresco no
 * pide red. Uno caducado se pinta y se refresca. Si la red falla se conserva el último dato bueno
 * hasta el límite de edad.
 */
export type AlmacenClaves = {
  getItem(clave: string): Promise<string | null>;
  setItem(clave: string, valor: string): Promise<void>;
  removeItem?(clave: string): Promise<void>;
};

export const VERSION_CACHE = 2;
export const PREFIJO_CACHE = `audite.libros.cache.v${VERSION_CACHE}.`;

export type PoliticaCache = { fresco: number; maximo: number };

const MIN = 60_000;
const DIA = 24 * 60 * MIN;
export const POLITICAS: Record<"estanteria" | "catalogo" | "libro", PoliticaCache> = {
  estanteria: { fresco: 5 * MIN, maximo: 14 * DIA },
  catalogo: { fresco: 10 * MIN, maximo: 14 * DIA },
  libro: { fresco: 10 * MIN, maximo: 14 * DIA },
};

export function claveCache(tipo: keyof typeof POLITICAS, id?: string): string {
  return `${PREFIJO_CACHE}${tipo}${id ? `.${id}` : ""}`;
}

type Sobre = { v: number; t: number; d: unknown };

export type LecturaCache<T> = { dato: T; edadMs: number; fresco: boolean };

export async function leerCache<T>(
  almacen: AlmacenClaves,
  clave: string,
  politica: PoliticaCache,
  validar: (bruto: unknown) => T | null,
  ahora: () => number = Date.now,
): Promise<LecturaCache<T> | null> {
  try {
    const bruto = await almacen.getItem(clave);
    if (!bruto) return null;
    const sobre = JSON.parse(bruto) as Partial<Sobre> | null;
    if (!sobre || sobre.v !== VERSION_CACHE || typeof sobre.t !== "number") return null;
    const edadMs = ahora() - sobre.t;
    if (edadMs < 0 || edadMs > politica.maximo) return null;
    const dato = validar(sobre.d);
    if (dato === null) return null;
    return { dato, edadMs, fresco: edadMs <= politica.fresco };
  } catch {
    return null;
  }
}

export async function escribirCache(almacen: AlmacenClaves, clave: string, dato: unknown, ahora: () => number = Date.now): Promise<void> {
  try {
    const sobre: Sobre = { v: VERSION_CACHE, t: ahora(), d: dato };
    await almacen.setItem(clave, JSON.stringify(sobre));
  } catch {
    // Sin almacenamiento: se sigue con la red.
  }
}

/** Memoria de la sesión: devuelve el dato al instante, sin esperar al disco. */
const memoria = new Map<string, { dato: unknown; t: number }>();

export function leerMemoria<T>(clave: string, politica: PoliticaCache, ahora: () => number = Date.now): LecturaCache<T> | null {
  const guardado = memoria.get(clave);
  if (!guardado) return null;
  const edadMs = ahora() - guardado.t;
  if (edadMs > politica.maximo) return null;
  return { dato: guardado.dato as T, edadMs, fresco: edadMs <= politica.fresco };
}

export function escribirMemoria(clave: string, dato: unknown, ahora: () => number = Date.now): void {
  memoria.set(clave, { dato, t: ahora() });
}

export function vaciarMemoriaCache(): void {
  memoria.clear();
}

export type OpcionesSwr<T> = {
  almacen: AlmacenClaves;
  clave: string;
  politica: PoliticaCache;
  validar: (bruto: unknown) => T | null;
  traer: () => Promise<T | null>;
  /** Se llama en cuanto hay un dato en memoria o disco, antes de la red. */
  alDato?: (lectura: LecturaCache<T>) => void;
  ahora?: () => number;
};

export type ResultadoSwr<T> = { dato: T | null; origen: "memoria" | "cache" | "red" | "cache-vieja" | "nada" };

export async function cargarSwr<T>(op: OpcionesSwr<T>): Promise<ResultadoSwr<T>> {
  const ahora = op.ahora ?? Date.now;
  let previa = leerMemoria<T>(op.clave, op.politica, ahora);
  let origenPrevio: "memoria" | "cache" = "memoria";
  if (!previa) {
    previa = await leerCache(op.almacen, op.clave, op.politica, op.validar, ahora);
    origenPrevio = "cache";
    if (previa) escribirMemoria(op.clave, previa.dato, () => ahora() - previa!.edadMs);
  }
  if (previa) op.alDato?.(previa);
  if (previa?.fresco) return { dato: previa.dato, origen: origenPrevio };
  let nuevo: T | null = null;
  try {
    nuevo = op.validar(await op.traer());
  } catch {
    nuevo = null;
  }
  if (nuevo !== null) {
    escribirMemoria(op.clave, nuevo, ahora);
    await escribirCache(op.almacen, op.clave, nuevo, ahora);
    return { dato: nuevo, origen: "red" };
  }
  return previa ? { dato: previa.dato, origen: "cache-vieja" } : { dato: null, origen: "nada" };
}
