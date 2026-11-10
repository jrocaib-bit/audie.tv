import type { Metadata } from "next";
import Link from "next/link";
import { FaqAyuda } from "@/components/faq-ayuda";

export const metadata: Metadata = {
  title: "Ayuda",
  description: "Preguntas sobre Audite: suscripción, cuenta, idiomas y contacto.",
};

export default function Page() {
  const google = process.env.GOOGLE_LOGIN_ENABLED === "true";
  return (
    <main className="mx-auto min-h-dvh w-full max-w-3xl bg-[#100E0C] px-6 py-16 text-[#F4ECE2]">
      <h1 className="font-display text-5xl">Ayuda</h1>
      <p className="mt-4 text-[#C9A96E]">La voz y la música están generadas con IA.</p>
      <p className="mt-6">
        <Link href="/contacto" className="inline-flex min-h-11 items-center underline">Formulario de contacto</Link>
      </p>
      <FaqAyuda google={google} />
    </main>
  );
}
