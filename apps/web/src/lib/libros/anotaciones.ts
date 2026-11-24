/**
 * Persistencia de progreso, marcadores, subrayados y notas. SOLO SERVIDOR.
 *
 * Con Supabase configurado y las tablas `libros_*` creadas (migración 20261124120000_libros.sql,
 * aún sin aplicar) se guarda por cuenta. Si no hay Supabase o la tabla no existe, se degrada a
 * memoria de proceso, sin romper. La sincronización real espera a la migración: mientras tanto el
 * cliente guarda siempre también en localStorage / AsyncStorage y vuelve a subir al entrar.
 */
import {
  NOTA_MAX,
  anotacionesVacias,
  nuevoIdLibros,
  ratioValido,
  type AnotacionesLibro,
  type MarcadorLibro,
  type NotaLibro,
  type ProgresoLibro,
  type SubrayadoLibro,
} from "@audite/domain";
import { clienteServicio } from "./acceso";

export type TipoLista = "marcadores" | "subrayados" | "notas";

const memoria = new Map<string, AnotacionesLibro>();

function clave(userId: string, libroId: string): string {
  return `${userId}::${libroId}`;
}

export function vaciarMemoria(): void {
  memoria.clear();
}

function enMemoria(userId: string, libroId: string): AnotacionesLibro {
  const k = clave(userId, libroId);
  let dato = memoria.get(k);
  if (!dato) {
    dato = anotacionesVacias();
    memoria.set(k, dato);
  }
  return dato;
}

const TABLAS = {
  progreso: "libros_progreso",
  marcadores: "libros_marcadores",
  subrayados: "libros_subrayados",
  notas: "libros_notas",
} as const;

/** La tabla aún no existe o el esquema no la conoce: se degrada a memoria. */
function tablaAusente(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  return error.code === "42P01" || error.code === "PGRST205" || /does not exist|schema cache|could not find the table/i.test(error.message ?? "");
}

function idValido(valor: unknown, max = 120): valor is string {
  return typeof valor === "string" && valor.length > 0 && valor.length <= max && /^[A-Za-z0-9._-]+$/.test(valor);
}

function recortar(valor: unknown): string | null {
  return idValido(valor) ? valor : null;
}

export type Validacion<T> = { ok: true; dato: T } | { ok: false };

export function validarProgreso(cuerpo: unknown, libroId: string): Validacion<ProgresoLibro> {
  const c = (cuerpo ?? {}) as Record<string, unknown>;
  if (!idValido(c.capitulo_id)) return { ok: false };
  if (c.ratio !== undefined && c.ratio !== null && ratioValido(c.ratio) === null) return { ok: false };
  return { ok: true, dato: { libro_id: libroId, capitulo_id: c.capitulo_id, bloque_id: recortar(c.bloque_id), ratio: ratioValido(c.ratio), updated_at: new Date().toISOString() } };
}

export function validarElemento(tipo: TipoLista, cuerpo: unknown, libroId: string): Validacion<MarcadorLibro | SubrayadoLibro | NotaLibro> {
  const c = (cuerpo ?? {}) as Record<string, unknown>;
  if (!idValido(c.capitulo_id)) return { ok: false };
  const id = idValido(c.id, 64) ? c.id : nuevoIdLibros();
  const base = { id, libro_id: libroId, capitulo_id: c.capitulo_id, created_at: new Date().toISOString() };
  if (tipo === "marcadores") return { ok: true, dato: { ...base, bloque_id: recortar(c.bloque_id) } };
  if (tipo === "subrayados") {
    const inicio = typeof c.inicio === "number" ? Math.trunc(c.inicio) : 0;
    const fin = typeof c.fin === "number" ? Math.trunc(c.fin) : -1;
    if (!idValido(c.bloque_id) || inicio < 0 || fin <= inicio || fin > 20000) return { ok: false };
    return { ok: true, dato: { ...base, bloque_id: c.bloque_id, inicio, fin, color: typeof c.color === "string" && /^[a-z]{1,20}$/.test(c.color) ? c.color : "oro" } };
  }
  const textoNota = typeof c.texto === "string" ? c.texto.trim() : "";
  if (!textoNota || textoNota.length > NOTA_MAX) return { ok: false };
  return { ok: true, dato: { ...base, bloque_id: recortar(c.bloque_id), subrayado_id: recortar(c.subrayado_id), texto: textoNota } };
}

export async function leerTodo(userId: string, libroId: string): Promise<AnotacionesLibro> {
  const cliente = userId.startsWith("mock-") ? null : clienteServicio();
  if (!cliente) return structuredClone(enMemoria(userId, libroId));
  const resultado = anotacionesVacias();
  for (const tipo of ["marcadores", "subrayados", "notas"] as const) {
    const { data, error } = await cliente.from(TABLAS[tipo]).select("*").eq("user_id", userId).eq("libro_id", libroId);
    if (tablaAusente(error)) return structuredClone(enMemoria(userId, libroId));
    if (!error && Array.isArray(data)) (resultado[tipo] as unknown[]) = data;
  }
  const { data } = await cliente.from(TABLAS.progreso).select("*").eq("user_id", userId).eq("libro_id", libroId).maybeSingle();
  if (data) resultado.progreso = data as ProgresoLibro;
  return resultado;
}

export async function guardarProgreso(userId: string, progreso: ProgresoLibro): Promise<void> {
  const cliente = userId.startsWith("mock-") ? null : clienteServicio();
  if (cliente) {
    const { error } = await cliente.from(TABLAS.progreso).upsert({ ...progreso, user_id: userId }, { onConflict: "user_id,libro_id" });
    if (!tablaAusente(error)) return;
  }
  enMemoria(userId, progreso.libro_id).progreso = progreso;
}

export async function crearElemento(userId: string, tipo: TipoLista, elemento: MarcadorLibro | SubrayadoLibro | NotaLibro): Promise<void> {
  const cliente = userId.startsWith("mock-") ? null : clienteServicio();
  if (cliente) {
    const { error } = await cliente.from(TABLAS[tipo]).upsert({ ...elemento, user_id: userId }, { onConflict: "id", ignoreDuplicates: true }); // un id ajeno nunca se pisa
    if (!tablaAusente(error)) return;
  }
  const lista = enMemoria(userId, elemento.libro_id)[tipo] as { id: string }[];
  const sin = lista.filter((item) => item.id !== elemento.id);
  sin.push(elemento);
  (enMemoria(userId, elemento.libro_id)[tipo] as unknown[]) = sin;
}

export async function borrarElemento(userId: string, libroId: string, tipo: TipoLista, id: string): Promise<void> {
  const cliente = userId.startsWith("mock-") ? null : clienteServicio();
  if (cliente) {
    const { error } = await cliente.from(TABLAS[tipo]).delete().eq("user_id", userId).eq("libro_id", libroId).eq("id", id);
    if (!tablaAusente(error)) return;
  }
  const dato = enMemoria(userId, libroId);
  (dato[tipo] as unknown[]) = (dato[tipo] as { id: string }[]).filter((item) => item.id !== id);
}
