import type { Metadata } from "next";
import { TEMAS } from "@audite/domain";
import { redirect } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ lang: string; id: string }> }): Promise<Metadata> {
  const { id, lang } = await params;
  const tema = TEMAS.find((item) => item.id === id);
  const ui = lang === "en" ? "en" : "es";
  return { title: tema?.titulo[ui] ?? "Audite", description: tema?.titulo[ui] };
}

export default async function Page({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { lang, id } = await params;
  const tema = TEMAS.find((item) => item.id === id);
  redirect(`/${lang === "en" ? "en" : "es"}/libro/${tema?.libroId ?? "gn"}`);
}
