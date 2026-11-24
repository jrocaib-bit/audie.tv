import { Lienzo } from "@/components/sala/lienzo";
import { SalaIndiceCabecera } from "@/components/sala/sala-indice-cabecera";
import { fichasSala } from "@/lib/sala-indice";
import { copiaSitio } from "@/sitio/i18n";
import Link from "next/link";

export function SitioSala({ lang }: { lang: string }) {
  const copy = copiaSitio(lang);
  if (!copy) return null;
  const ui = lang === "en" ? "en" : "es";
  const fichas = fichasSala(ui);
  return (
    <main data-indice-sala="" className="mx-auto w-full max-w-6xl px-5 py-12 md:px-8">
      <h1 className="font-display text-5xl">{copy.salaTitle}</h1>
      <p className="mt-4 max-w-2xl text-xl text-[#F4ECE2]">{copy.salaLede}</p>
      <p className="mt-4 max-w-2xl text-lg text-[#B7AB9C]">{copy.salaIntro}</p>
      <SalaIndiceCabecera
        lang={lang}
        copy={copy}
        fichas={fichas.map(({ id, href, titulo, libro }) => ({ id, href, titulo, libro }))}
      />
      <ul className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {fichas.map((ficha, indice) => (
          <li key={ficha.id} className="aparecer h-full" style={{ ["--i" as string]: indice }}>
            <Link
              href={ficha.href}
              data-obra={ficha.id}
              data-abierta={ficha.abierta ? "" : undefined}
              className="tarjeta-libro flex h-full flex-col overflow-hidden rounded-2xl bg-[#1B1815]"
            >
              <span className="marco-obra relative block w-full shrink-0 overflow-hidden bg-[#1B1815]" style={{ aspectRatio: "4 / 5" }}>
                {ficha.src ? (
                  <Lienzo src={ficha.src} alt={ficha.alt} className="absolute inset-0 h-full w-full" />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center bg-[#1B1815]">
                    <span className="font-display text-5xl text-[#C9A96E]" aria-hidden="true">{ficha.titulo.slice(0, 1)}</span>
                  </span>
                )}
                {ficha.abierta ? (
                  <span data-gratis="" className="absolute top-2 left-2 rounded-full bg-[#E0C48A] px-2.5 py-1 text-xs font-semibold tracking-wide text-[#100E0C] uppercase">
                    {copy.salaGratis}
                  </span>
                ) : null}
              </span>
              <span className="block px-3 py-3">
                <span className="block font-display text-lg leading-tight">{ficha.titulo}</span>
                {ficha.libro ? <span className="mt-1 block text-sm text-[#B7AB9C]">{ficha.libro}</span> : null}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
