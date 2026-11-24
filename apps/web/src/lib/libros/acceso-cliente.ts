/** Acceso y progreso en el navegador. Lo comparten la estantería y la landing de cada libro. */
import { crearClienteLibros, parseAnotaciones, type MockLibros, type VistaLector } from "@audite/domain";
import { supabaseWeb } from "@/lib/auth-web";
import { claveLibro } from "./clave-local";

/** Hay progreso de lectura guardado en este dispositivo. */
export function hayProgreso(id: string): boolean {
  try {
    return Boolean(parseAnotaciones(JSON.parse(localStorage.getItem(claveLibro(id)) ?? "null"), id).progreso);
  } catch {
    return false;
  }
}

/** Consulta el acceso con el mismo mecanismo del lector. Sin sesión ni mock, no hay red y sale `sin-sesion`. */
export async function consultarVista(mock: MockLibros | null): Promise<VistaLector> {
  let token: string | null = null;
  try {
    const remoto = supabaseWeb();
    token = remoto ? ((await remoto.auth.getSession()).data.session?.access_token ?? null) : null;
  } catch {
    token = null;
  }
  return token || mock ? await crearClienteLibros({ base: "", token, mock }).acceso() : "sin-sesion";
}
