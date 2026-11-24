/**
 * Carga del texto del reproductor en la app. El texto nunca va en el bundle.
 * Se pide a `EXPO_PUBLIC_CONTENT_BASE` + `/api/texto/<id>` con el token de la sesión.
 */
import { estadoDeRespuesta, idTextoValido, leerTextoEpisodio, type EstadoTexto, type TextoEpisodio } from "@audite/domain";

export type CargaTexto = { tipo: Exclude<EstadoTexto, "listo"> } | { tipo: "listo"; texto: TextoEpisodio };

export function urlTexto(base: string, id: string, idioma: "es" | "en"): string | null {
  if (!idTextoValido(id)) return null;
  return `${base.replace(/\/+$/, "")}/api/texto/${id}?lang=${idioma}`;
}

export async function cargarTexto(opciones: {
  base: string;
  id: string;
  idioma: "es" | "en";
  token: string | null;
  pedir?: typeof fetch;
}): Promise<CargaTexto> {
  const url = urlTexto(opciones.base, opciones.id, opciones.idioma);
  if (!url) return { tipo: "apagado" };
  const headers: Record<string, string> = {};
  if (opciones.token) headers.Authorization = `Bearer ${opciones.token}`;
  try {
    const respuesta = await (opciones.pedir ?? fetch)(url, { headers, cache: "no-store" });
    if (!respuesta.ok) {
      let error: unknown;
      try {
        error = ((await respuesta.json()) as { error?: unknown }).error;
      } catch {
        error = undefined;
      }
      return { tipo: estadoDeRespuesta(respuesta.status, error) };
    }
    const texto = leerTextoEpisodio(await respuesta.json());
    return texto ? { tipo: "listo", texto } : { tipo: "error" };
  } catch {
    return { tipo: "error" };
  }
}
