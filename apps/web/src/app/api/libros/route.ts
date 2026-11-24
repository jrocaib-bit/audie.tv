import { cargarCatalogo, fichaPublica, mostrarAmazon } from "@/lib/libros/carga";
import { respuesta } from "@/lib/libros/acceso";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Catálogo: metadatos e índice, nunca bloques. Sin URL de Kindle ni rutas del disco. */
export async function GET() {
  const libros = (await cargarCatalogo()).map(fichaPublica);
  return respuesta(200, { libros, mostrar_amazon: mostrarAmazon() });
}
