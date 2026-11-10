import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EnlaceSoporte } from "@/components/enlace-soporte";
import { FormularioSoporte } from "@/components/formularios";
import { marcaFormulario } from "@/lib/formularios/acciones";
import { esIdiomaPublico, idiomasPublicos } from "@/sitio/i18n";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const languages = Object.fromEntries(idiomasPublicos.map((idioma) => [idioma, `/${idioma}/contacto`]));
  return {
    title: "Contacto",
    description: "Escribe a Audite: nombre, correo y mensaje.",
    alternates: { canonical: `/${lang}/contacto`, languages: { ...languages, "x-default": "/es/contacto" } },
  };
}

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!esIdiomaPublico(lang)) notFound();
  const marca = await marcaFormulario();
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col bg-[#100E0C] px-6 py-16 text-[#F4ECE2]">
      <h1 className="font-display text-5xl">Contacto</h1>
      <p className="mt-4 text-[#B7AB9C]">Nombre, correo, mensaje y la casilla de privacidad. También puedes escribir a soporte.</p>
      <FormularioSoporte marca={marca} />
      <p className="mt-8">
        <EnlaceSoporte className="inline-flex min-h-11 items-center underline">soporte@audite.tv</EnlaceSoporte>
      </p>
    </main>
  );
}
