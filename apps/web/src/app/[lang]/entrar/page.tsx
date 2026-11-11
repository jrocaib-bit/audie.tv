import type { Metadata } from "next";
import { Entrar } from "@/components/entrar";
import { esIdiomaPublico } from "@/sitio/i18n";
import { notFound } from "next/navigation";

export const metadata: Metadata = { title: "Entrar" };

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!esIdiomaPublico(lang)) notFound();
  return <Entrar lang={lang} google={process.env.GOOGLE_LOGIN_ENABLED === "true"} />;
}
