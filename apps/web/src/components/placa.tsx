import Image from "next/image";
import { esPortadaProvisional, obraWebp, rotuloObra, type ObraVisible } from "@audite/content/obras";
import { PortadaMarca } from "@/components/portada-marca";

export function Placa({ obra, lang }: { obra: ObraVisible; lang: string }) {
  if (esPortadaProvisional(obra.episodio)) return null;
  const ui = lang === "en" ? "en" : "es";
  const marca = (codigo: "es" | "en") => (obra.detalle ? (codigo === "es" ? " (detalle)" : " (detail)") : "");
  return (
    <figure className="max-w-xl border-l-[3px] border-[#C9A96E] bg-[#100E0C]/85 px-4 py-3 text-[#F4ECE2]">
      <figcaption>
        <p className="kicker text-[#C9A96E]">{rotuloObra(obra, ui)}</p>
        <p className="font-display mt-2 text-[1.35rem] leading-tight">
          {obra.titulo[ui]}
          {marca(ui)}
        </p>
        <p className="mt-1 text-sm text-[#F4ECE2]">{[obra.autor[ui], obra.fecha.trim()].filter(Boolean).join(" · ")}</p>
        {obra.ubicacion[ui].trim() ? <p className="text-sm text-[#B7AB9C]">{obra.ubicacion[ui]}</p> : null}
      </figcaption>
    </figure>
  );
}

export function ObraFoto({
  obra,
  priority = false,
  className = "h-full w-full object-cover",
  mover = false,
  lang = "es",
}: {
  obra: ObraVisible;
  priority?: boolean;
  className?: string;
  mover?: boolean;
  lang?: "es" | "en";
}) {
  if (esPortadaProvisional(obra.episodio)) {
    return <PortadaMarca episodioId={obra.episodio} lang={lang} className={className} />;
  }
  return (
    <Image
      src={obraWebp(obra)}
      alt=""
      fill
      sizes="(min-width: 1024px) 40vw, 100vw"
      priority={priority}
      className={`object-cover ${className} ${mover ? "obra-drift" : ""}`}
    />
  );
}
