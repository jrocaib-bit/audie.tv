import type { Metadata } from "next";
import { TEMAS } from "@audite/domain";
import { leerLibro } from "@audite/content/app-catalog";
import { FichaV2 } from "@/components/v2/ficha";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const tema = TEMAS.find((item) => item.id === id);
  return { title: tema?.titulo.es ?? "Tema", description: tema?.titulo.es };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const libroId = TEMAS.find((item) => item.id === id)?.libroId ?? id;
  const filas = leerLibro(libroId).map((episodio) => ({ id: episodio.id, etiqueta: episodio.etiqueta?.es || episodio.capitulos || episodio.id }));
  return <FichaV2 tipo="tema" id={id} filas={filas} />;
}
