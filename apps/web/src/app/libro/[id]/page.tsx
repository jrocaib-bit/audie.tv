import type { Metadata } from "next";
import { leerLibro, loadAppCatalog } from "@audite/content/app-catalog";
import { FichaV2 } from "@/components/v2/ficha";

export const metadata: Metadata = { title: "Libro" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const catalogo = loadAppCatalog();
  const fuente = leerLibro(id);
  const filas = (fuente.length > 0 ? fuente : catalogo.pendientes.filter((episodio) => episodio.bookId === id)).map((episodio) => ({ id: episodio.id, etiqueta: episodio.etiqueta?.es || episodio.capitulos || episodio.id }));
  return <FichaV2 tipo="libro" id={id} filas={filas} />;
}
