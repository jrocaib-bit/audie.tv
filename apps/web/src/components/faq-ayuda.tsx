import Link from "next/link";
import type { ReactNode } from "react";
import { EnlaceSoporte } from "@/components/enlace-soporte";
import { seccionesAyuda } from "@/lib/faq-centro";

const LOCAL: Record<string, string> = {
  "https://audite.tv": "/",
  "https://audite.tv/contacto": "/contacto",
  "https://audite.tv/ayuda": "/ayuda",
  "https://audite.tv/privacidad": "/privacidad",
  "https://audite.tv/cuenta": "/cuenta",
  "https://audite.tv/correo/baja": "/correo/baja",
};

function trozo(texto: string, clave: string): ReactNode[] {
  const marcas = texto.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g);
  return marcas.filter(Boolean).map((parte, indice) => {
    const id = `${clave}-${indice}`;
    if (parte.startsWith("**") && parte.endsWith("**")) return <strong key={id}>{parte.slice(2, -2)}</strong>;
    if (parte.startsWith("`") && parte.endsWith("`")) return <code key={id}>{parte.slice(1, -1)}</code>;
    if (parte.startsWith("*") && parte.endsWith("*")) return <em key={id}>{parte.slice(1, -1)}</em>;
    const enlace = parte.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (!enlace) return <span key={id}>{parte}</span>;
    const [, etiqueta, href] = enlace;
    if (href?.startsWith("mailto:")) return <EnlaceSoporte key={id} className="underline">{etiqueta}</EnlaceSoporte>;
    const local = href ? LOCAL[href] : undefined;
    if (local) return <Link key={id} href={local} className="underline">{etiqueta}</Link>;
    if (href?.startsWith("#")) return <a key={id} href={href} className="underline">{etiqueta}</a>;
    return <a key={id} href={href} className="underline">{etiqueta}</a>;
  });
}

function Bloque({ texto, clave }: { texto: string; clave: string }) {
  const partes = texto.split(/\n\n+/);
  return (
    <>
      {partes.map((parte, indice) => {
        const lineas = parte.split("\n");
        const viñetas = lineas.every((linea) => linea.startsWith("- "));
        const pasos = lineas.every((linea) => /^\d+\. /.test(linea));
        if (viñetas) {
          return (
            <ul key={`${clave}-${indice}`} className="mt-3 list-disc space-y-2 pl-5">
              {lineas.map((linea) => <li key={linea}>{trozo(linea.slice(2), `${clave}-${linea}`)}</li>)}
            </ul>
          );
        }
        if (pasos) {
          return (
            <ol key={`${clave}-${indice}`} className="mt-3 list-decimal space-y-2 pl-5">
              {lineas.map((linea) => <li key={linea}>{trozo(linea.replace(/^\d+\. /, ""), `${clave}-${linea}`)}</li>)}
            </ol>
          );
        }
        return <p key={`${clave}-${indice}`} className="mt-3">{trozo(parte, `${clave}-${indice}`)}</p>;
      })}
    </>
  );
}

export function FaqAyuda({ google = false }: { google?: boolean }) {
  return (
    <div className="mt-10 grid gap-12">
      {seccionesAyuda(google).map((seccion) => (
        <section key={seccion.id} id={seccion.id} aria-labelledby={`${seccion.id}-titulo`} className="scroll-mt-8">
          <h2 id={`${seccion.id}-titulo`} className="font-display text-3xl">{seccion.titulo}</h2>
          {seccion.intro ? <Bloque texto={seccion.intro} clave={`${seccion.id}-intro`} /> : null}
          <div className="mt-4 divide-y divide-[#2E2924] border-y border-[#2E2924]">
            {seccion.preguntas.map((pregunta) => (
              <details key={pregunta.id} id={pregunta.id} className="group scroll-mt-8 py-1">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 py-2 text-left text-lg [&::-webkit-details-marker]:hidden">
                  <span>{pregunta.pregunta}</span>
                  <span aria-hidden="true" className="text-[#C9A96E] group-open:rotate-45">+</span>
                </summary>
                <div className="pb-4 text-[#B7AB9C]">
                  <Bloque texto={pregunta.respuesta} clave={pregunta.id} />
                </div>
              </details>
            ))}
          </div>
          {seccion.cierre ? <div className="text-[#F4ECE2]"><Bloque texto={seccion.cierre} clave={`${seccion.id}-cierre`} /></div> : null}
        </section>
      ))}
    </div>
  );
}
