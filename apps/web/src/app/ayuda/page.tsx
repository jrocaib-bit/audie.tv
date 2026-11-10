import { copiaSitio } from "@/sitio/i18n";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Ayuda" };

export default function Page() {
  const copy = copiaSitio("es");
  if (!copy) return null;
  const preguntas = [
    [copy.faqPriceQ, copy.faqPriceA],
    [copy.faqTrialQ, copy.faqTrialA],
    [copy.faqCancelQ, copy.faqCancelA],
    [copy.faqLangQ, copy.faqLangA],
  ] as const;
  return (
    <main className="mx-auto min-h-dvh w-full max-w-2xl bg-[#100E0C] px-6 py-16 text-[#F4ECE2]">
      <h1 className="font-display text-5xl">Ayuda</h1>
      <dl className="mt-8 grid gap-6">
        {preguntas.map(([pregunta, respuesta]) => (
          <div key={pregunta}>
            <dt className="font-display text-2xl">{pregunta}</dt>
            <dd className="mt-2 text-[#B7AB9C]">{respuesta}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-10">
        <a className="text-[#C9A96E]" href="mailto:soporte@audite.tv">soporte@audite.tv</a>
      </p>
    </main>
  );
}
