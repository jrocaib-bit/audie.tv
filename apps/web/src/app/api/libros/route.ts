import { cargarCatalogo, fichaPublica, mostrarAmazon } from "@/lib/libros/carga";
import { respuestaPublica } from "@/lib/libros/cache-publica";

export const runtime = "nodejs";
// Sigue dinámica (lee el almacén en cada instancia fría). La cabecera Cache-Control la pone la respuesta.
export const dynamic = "force-dynamic";

/** Catálogo: metadatos e índice, nunca bloques. Sin URL de Kindle ni rutas del disco. */
export async function GET(request: Request) {
  const libros = (await cargarCatalogo()).map(fichaPublica);
  return respuestaPublica({ libros, mostrar_amazon: mostrarAmazon() }, request);
}
