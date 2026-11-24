/** Datos de la estantería en la app. Sin React Native: se puede probar con Vitest. */
import { archivoPortada, etiquetaLegible, textoLimpio, type Disponibilidad, type VolumenEstanteria } from "@audite/domain";

const DISPONIBILIDADES: Disponibilidad[] = ["lectura", "preparandose", "borrador"];

export function urlPortadaApp(base: string, archivo: string): string {
  return `${base.replace(/\/$/, "")}/api/libros/portada/${archivo}`;
}

export const urlLomo = (base: string, volumen: number) => urlPortadaApp(base, archivoPortada("lomo", volumen, "webp"));
export const urlCubierta = (base: string, volumen: number) => urlPortadaApp(base, archivoPortada("cubierta", volumen, "webp", 480));

function texto(valor: unknown): string | null {
  return typeof valor === "string" ? valor : null;
}

/** Acepta solo lo que la web publica. Descarta lo que no encaja, sin romper la pantalla. */
export function leerVolumenes(dato: unknown): VolumenEstanteria[] {
  const lista = (dato as { volumenes?: unknown } | null)?.volumenes;
  if (!Array.isArray(lista)) return [];
  const salida: VolumenEstanteria[] = [];
  for (const bruto of lista) {
    if (!bruto || typeof bruto !== "object") continue;
    const v = bruto as Record<string, unknown>;
    const id = texto(v.id);
    const titulo = texto(v.titulo);
    if (typeof v.volumen !== "number" || v.volumen < 1 || v.volumen > 16 || !id || !titulo) continue;
    if (!DISPONIBILIDADES.includes(v.disponibilidad as Disponibilidad)) continue;
    const episodios = Array.isArray(v.episodios_destacados) ? v.episodios_destacados : [];
    salida.push({
      volumen: v.volumen,
      id,
      libro: textoLimpio(texto(v.libro) ?? ""),
      titulo: textoLimpio(titulo),
      subtitulo: textoLimpio(texto(v.subtitulo) ?? ""),
      rotulo: textoLimpio(texto(v.rotulo) ?? ""),
      color: /^#[0-9a-fA-F]{6}$/.test(texto(v.color) ?? "") ? (v.color as string) : "#2E2924",
      sinopsis: textoLimpio(texto(v.sinopsis) ?? ""),
      credito_obra: textoLimpio(texto(v.credito_obra) ?? ""),
      borrador: v.borrador === true,
      episodios_total: typeof v.episodios_total === "number" ? v.episodios_total : 0,
      episodios_destacados: episodios.slice(0, 3).flatMap((e) => {
        const ep = e as Record<string, unknown> | null;
        const episodio_id = texto(ep?.episodio_id);
        return episodio_id ? [{ episodio_id, etiqueta: etiquetaLegible(texto(ep?.etiqueta) ?? ""), titulo: textoLimpio(texto(ep?.titulo) ?? "") }] : [];
      }),
      disponibilidad: v.disponibilidad as Disponibilidad,
    });
  }
  return salida.sort((a, b) => a.volumen - b.volumen);
}

/** Trae la estantería. Si la red o el servidor fallan, devuelve `null` y la pantalla conserva la lista. */
export async function cargarEstanteriaApp(base: string, fetcher: typeof fetch = fetch): Promise<VolumenEstanteria[] | null> {
  try {
    const respuesta = await fetcher(`${base.replace(/\/$/, "")}/api/libros/estanteria`);
    if (!respuesta.ok) return null;
    const lista = leerVolumenes(await respuesta.json());
    return lista.length > 0 ? lista : null;
  } catch {
    return null;
  }
}
