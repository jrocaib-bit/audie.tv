import type { Metadata } from "next";
import { esPortadaProvisional, obrasVisibles } from "@audite/content/obras";
import { portadasDeRetos } from "@audite/content/obras-creditos";

export const metadata: Metadata = { title: "Créditos" };

export default function Page() {
  const obras = obrasVisibles();
  return (
    <main id="contenido" className="app-clear mx-auto min-h-dvh w-full max-w-3xl bg-[#100E0C] px-6 py-16 text-[#F4ECE2]">
      <h1 className="font-display t-h1">Créditos</h1>
      <p className="mt-4 text-sm">Referencias cruzadas: OpenBible.info, CC BY 4.0.</p>
      <ul className="mt-6 space-y-3">
        {portadasDeRetos().map((portada) => (
          <li key={portada.id} className="text-sm text-[#B7AB9C]">{portada.titulo.es} · {portada.autor.es} · {portada.ubicacion.es} · {portada.licencia}</li>
        ))}
        {obras.filter((obra) => !esPortadaProvisional(obra.episodio)).map((obra) => (
          <li key={obra.id} className="text-sm text-[#B7AB9C]">{obra.placa.es}</li>
        ))}
      </ul>
    </main>
  );
}