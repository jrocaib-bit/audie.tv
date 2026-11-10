import type { Metadata } from "next";
import { obrasVisibles } from "@audite/content/obras";
import { portadasDeRetos } from "@audite/content/obras-creditos";

export const metadata: Metadata = { title: "Créditos" };

export default function Page() {
  const obras = obrasVisibles();
  return (
    <main id="contenido" className="app-clear mx-auto w-full max-w-lg px-4 pt-4">
      <h1 className="font-display text-4xl leading-none">Créditos</h1>
      <p className="mt-4 text-sm">Referencias cruzadas: OpenBible.info, CC BY 4.0.</p>
      <ul className="mt-6 space-y-3">
        {portadasDeRetos().map((portada) => (
          <li key={portada.id} className="text-sm text-muted">{portada.titulo.es} · {portada.autor.es} · {portada.ubicacion.es} · {portada.licencia}</li>
        ))}
        {obras.slice(0, 12).map((obra) => (
          <li key={obra.id} className="text-sm text-muted">{obra.placa.es}</li>
        ))}
      </ul>
    </main>
  );
}