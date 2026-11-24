import { crearClienteLibros, type MockLibros } from "@audite/domain";
import { supabaseApp } from "../auth";
import { baseContenido } from "./config";

export async function tokenApp(): Promise<string | null> {
  try {
    const sesion = (await supabaseApp()?.auth.getSession())?.data.session;
    return sesion?.access_token ?? null;
  } catch {
    return null;
  }
}

/** Cliente de la API de libros. El texto llega solo de aquí: nada de libros en el bundle. */
export async function clienteLibrosApp(mock: MockLibros | null = null, token?: string | null) {
  const t = token === undefined ? await tokenApp() : token;
  return { token: t, api: crearClienteLibros({ base: baseContenido(), token: t, mock }) };
}
