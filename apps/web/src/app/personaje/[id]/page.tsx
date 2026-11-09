import type { Metadata } from "next";
import { PERSONAJES } from "@audite/domain";
import { loadAppCatalog } from "@audite/content/app-catalog";
import { FichaV2 } from "@/components/v2/ficha";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const persona = PERSONAJES.find((item) => item.id === id);
  return { title: persona?.titulo.es ?? "Personaje" };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const libroId = PERSONAJES.find((item) => item.id === id)?.libroId ?? id;
  const filas = loadAppCatalog().pendientes.filter((episodio) => episodio.bookId === libroId).map((episodio) => ({ id: episodio.id, etiqueta: episodio.etiqueta?.es || episodio.capitulos || episodio.id }));
  return <FichaV2 tipo="personaje" id={id} filas={filas} />;
}
