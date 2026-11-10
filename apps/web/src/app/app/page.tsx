import type { Metadata } from "next";
import { origenSitio } from "@/lib/sitio-publico";
import { marcaFormulario } from "@/lib/formularios/acciones";
import { PaginaApp } from "./pagina";

const base = origenSitio();

export const metadata: Metadata = {
  title: "La app de Audite",
  description: "Avísame cuando la app esté disponible. Mientras, escucha en la web.",
  openGraph: { title: "La app de Audite", description: "Avísame cuando la app esté disponible.", url: `${base}/app`, images: [`${base}/obras/reto-adviento_o1-16x9.webp`] },
};

export default async function Page() {
  return <PaginaApp marca={await marcaFormulario()} />;
}
