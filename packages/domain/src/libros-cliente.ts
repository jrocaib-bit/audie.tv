/**
 * Anotaciones del lector y cliente de la API de libros. Lo comparten la web y la app.
 * Las anclas son iguales en las dos: libro_id + capitulo_id + bloque_id (+ inicio/fin).
 */
import type { LibroCortado, LibroFicha, RecomendacionLibro, CapituloLibro, VistaLector } from "./libros";

export type ProgresoLibro = { libro_id: string; capitulo_id: string; bloque_id: string | null; ratio: number | null; updated_at: string };
export type MarcadorLibro = { id: string; libro_id: string; capitulo_id: string; bloque_id: string | null; created_at: string };
export type SubrayadoLibro = { id: string; libro_id: string; capitulo_id: string; bloque_id: string; inicio: number; fin: number; color: string; created_at: string };
export type NotaLibro = { id: string; libro_id: string; capitulo_id: string; bloque_id: string | null; subrayado_id: string | null; texto: string; created_at: string };

export type AnotacionesLibro = {
  progreso: ProgresoLibro | null;
  marcadores: MarcadorLibro[];
  subrayados: SubrayadoLibro[];
  notas: NotaLibro[];
};

export const NOTA_MAX = 600;

export function anotacionesVacias(): AnotacionesLibro {
  return { progreso: null, marcadores: [], subrayados: [], notas: [] };
}

/** Identificador con forma de uuid v4. No es secreto: solo tiene que ser único. */
export function nuevoIdLibros(azar: () => number = Math.random): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (letra) => {
    const n = Math.floor(azar() * 16);
    return (letra === "x" ? n : (n & 0x3) | 0x8).toString(16);
  });
}

export function ratioValido(valor: unknown): number | null {
  return typeof valor === "number" && Number.isFinite(valor) && valor >= 0 && valor <= 1 ? valor : null;
}

function texto(valor: unknown, max = 120): string | null {
  return typeof valor === "string" && valor.length > 0 && valor.length <= max ? valor : null;
}

/** Valida lo que llega al servidor o sale del almacenamiento local. Descarta lo que no encaja. */
export function parseAnotaciones(bruto: unknown, libroId: string): AnotacionesLibro {
  const dato = (bruto && typeof bruto === "object" ? bruto : {}) as Record<string, unknown>;
  const lista = (clave: string): Record<string, unknown>[] =>
    Array.isArray(dato[clave]) ? (dato[clave] as unknown[]).filter((x): x is Record<string, unknown> => Boolean(x) && typeof x === "object") : [];
  const fecha = (v: unknown) => (typeof v === "string" && !Number.isNaN(Date.parse(v)) ? v : new Date(0).toISOString());
  const marcadores = lista("marcadores").flatMap((m) => {
    const id = texto(m.id); const capitulo_id = texto(m.capitulo_id);
    return id && capitulo_id ? [{ id, libro_id: libroId, capitulo_id, bloque_id: texto(m.bloque_id), created_at: fecha(m.created_at) }] : [];
  });
  const subrayados = lista("subrayados").flatMap((m) => {
    const id = texto(m.id); const capitulo_id = texto(m.capitulo_id); const bloque_id = texto(m.bloque_id);
    const inicio = typeof m.inicio === "number" ? Math.trunc(m.inicio) : 0;
    const fin = typeof m.fin === "number" ? Math.trunc(m.fin) : -1;
    return id && capitulo_id && bloque_id && inicio >= 0 && fin > inicio
      ? [{ id, libro_id: libroId, capitulo_id, bloque_id, inicio, fin, color: texto(m.color, 20) ?? "oro", created_at: fecha(m.created_at) }]
      : [];
  });
  const notas = lista("notas").flatMap((m) => {
    const id = texto(m.id); const capitulo_id = texto(m.capitulo_id); const cuerpo = texto(m.texto, NOTA_MAX);
    return id && capitulo_id && cuerpo
      ? [{ id, libro_id: libroId, capitulo_id, bloque_id: texto(m.bloque_id), subrayado_id: texto(m.subrayado_id), texto: cuerpo, created_at: fecha(m.created_at) }]
      : [];
  });
  const p = dato.progreso && typeof dato.progreso === "object" ? (dato.progreso as Record<string, unknown>) : null;
  const capitulo = p ? texto(p.capitulo_id) : null;
  const progreso = p && capitulo ? { libro_id: libroId, capitulo_id: capitulo, bloque_id: texto(p.bloque_id), ratio: ratioValido(p.ratio), updated_at: fecha(p.updated_at) } : null;
  return { progreso, marcadores, subrayados, notas };
}

function unir<T extends { id: string }>(a: T[], b: T[]): T[] {
  const mapa = new Map<string, T>();
  for (const item of [...a, ...b]) mapa.set(item.id, item);
  return [...mapa.values()];
}

/** Une lo local con lo remoto. Gana el progreso más reciente; las listas se suman por id. */
export function fusionarAnotaciones(local: AnotacionesLibro, remoto: AnotacionesLibro): AnotacionesLibro {
  const progreso = !local.progreso ? remoto.progreso : !remoto.progreso ? local.progreso : Date.parse(remoto.progreso.updated_at) >= Date.parse(local.progreso.updated_at) ? remoto.progreso : local.progreso;
  return {
    progreso,
    marcadores: unir(local.marcadores, remoto.marcadores),
    subrayados: unir(local.subrayados, remoto.subrayados),
    notas: unir(local.notas, remoto.notas),
  };
}

export const MOCKS_LIBROS = ["sin", "gratis", "premium"] as const;
export type MockLibros = (typeof MOCKS_LIBROS)[number];

export function mockValido(valor: string | null | undefined): MockLibros | null {
  const limpio = (valor ?? "").trim().toLowerCase();
  return (MOCKS_LIBROS as readonly string[]).includes(limpio) ? (limpio as MockLibros) : null;
}

export function vistaDeMock(mock: MockLibros): VistaLector {
  return mock === "sin" ? "sin-sesion" : mock === "gratis" ? "gratuito" : "premium";
}

export type OpcionesClienteLibros = {
  base: string;
  /** Token de sesión de Supabase, si la hay. */
  token?: string | null;
  /** Solo desarrollo. El servidor lo ignora en producción. */
  mock?: MockLibros | null;
  fetcher?: typeof fetch;
};

export type RespuestaCapitulo =
  | { estado: "ok"; capitulo: CapituloLibro }
  | { estado: "sin-sesion" | "sin-permiso" | "no-encontrado" | "error" };

/** Cliente fino de la API. Funciona igual en el navegador y en React Native. */
export function crearClienteLibros(opciones: OpcionesClienteLibros) {
  const base = opciones.base.replace(/\/$/, "");
  const llamar = opciones.fetcher ?? fetch;
  const cabeceras = (extra?: Record<string, string>): Record<string, string> => ({
    ...(opciones.token ? { Authorization: `Bearer ${opciones.token}` } : {}),
    ...(opciones.mock ? { "x-libros-mock": opciones.mock } : {}),
    ...extra,
  });
  async function json<T>(ruta: string, init?: RequestInit): Promise<{ estado: number; dato: T | null }> {
    try {
      const respuesta = await llamar(`${base}${ruta}`, { ...init, headers: { ...cabeceras(init?.body ? { "content-type": "application/json" } : undefined) } });
      const dato = (await respuesta.json().catch(() => null)) as T | null;
      return { estado: respuesta.status, dato };
    } catch {
      return { estado: 0, dato: null };
    }
  }
  const id = encodeURIComponent;
  return {
    async catalogo(): Promise<{ libros: LibroFicha[]; mostrar_amazon: boolean }> {
      const { dato } = await json<{ libros?: LibroFicha[]; mostrar_amazon?: boolean }>("/api/libros");
      return { libros: dato?.libros ?? [], mostrar_amazon: dato?.mostrar_amazon === true };
    },
    async libro(libroId: string): Promise<{ ficha: LibroFicha; lectura: LibroCortado | null } | null> {
      const { estado, dato } = await json<{ ficha: LibroFicha; lectura: LibroCortado | null }>(`/api/libros/${id(libroId)}`);
      return estado === 200 && dato ? dato : null;
    },
    async acceso(): Promise<VistaLector> {
      const { dato } = await json<{ vista?: VistaLector }>("/api/libros/acceso");
      return dato?.vista === "premium" || dato?.vista === "gratuito" ? dato.vista : "sin-sesion";
    },
    async capitulo(libroId: string, capituloId: string): Promise<RespuestaCapitulo> {
      const { estado, dato } = await json<{ capitulo?: CapituloLibro }>(`/api/libros/${id(libroId)}/capitulos/${id(capituloId)}`);
      if (estado === 200 && dato?.capitulo) return { estado: "ok", capitulo: dato.capitulo };
      if (estado === 401) return { estado: "sin-sesion" };
      if (estado === 403) return { estado: "sin-permiso" };
      if (estado === 404) return { estado: "no-encontrado" };
      return { estado: "error" };
    },
    async recomendaciones(episodioId: string): Promise<RecomendacionLibro[]> {
      const { dato } = await json<{ libros?: RecomendacionLibro[] }>(`/api/episodios/${id(episodioId)}/libros`);
      return dato?.libros ?? [];
    },
    /** Trae todo lo guardado en cuenta. `null` si no hay sesión o el servidor no responde. */
    async leerAnotaciones(libroId: string): Promise<AnotacionesLibro | null> {
      const { estado, dato } = await json<AnotacionesLibro>(`/api/libros/${id(libroId)}/anotaciones`);
      return estado === 200 && dato ? parseAnotaciones(dato, libroId) : null;
    },
    async guardarProgreso(libroId: string, progreso: { capitulo_id: string; bloque_id: string | null; ratio: number | null }): Promise<boolean> {
      return (await json(`/api/libros/${id(libroId)}/progreso`, { method: "PUT", body: JSON.stringify(progreso) })).estado === 200;
    },
    async crear(libroId: string, tipo: "marcadores" | "subrayados" | "notas", cuerpo: Record<string, unknown>): Promise<boolean> {
      const { estado } = await json(`/api/libros/${id(libroId)}/${tipo}`, { method: "POST", body: JSON.stringify(cuerpo) });
      return estado === 200 || estado === 201;
    },
    async borrar(libroId: string, tipo: "marcadores" | "subrayados" | "notas", itemId: string): Promise<boolean> {
      const { estado } = await json(`/api/libros/${id(libroId)}/${tipo}?id=${id(itemId)}`, { method: "DELETE" });
      return estado === 200;
    },
  };
}
