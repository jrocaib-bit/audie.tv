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

/**
 * Obra completa: contain sobre su propio fondo desenfocado. Nunca recorta la pintura.
 * Se coloca de forma absoluta en el contenedor posicionado del llamador.
 */
export function ObraFoto({
  obra,
  priority = false,
  className = "h-full w-full",
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
    return <PortadaMarca episodioId={obra.episodio} lang={lang} className={className.replace(/\bobject-cover\b/g, "")} />;
  }
  const src = obraWebp(obra);
  const clase = className.replace(/\bobject-(cover|contain)\b/g, "").replace(/\b(absolute|inset-0|h-full|w-full)\b/g, "").trim();
  return (
    <div data-obra={obra.id} className="sala-lienzo absolute inset-0 overflow-hidden bg-[#0C0B09]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" aria-hidden="true" loading="lazy" decoding="async" className="bucle-fondo pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[#100E0C]/45" aria-hidden="true" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        fetchPriority={priority ? "high" : "auto"}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        className={`sala-obra absolute inset-0 h-full w-full object-contain ${clase} ${mover ? "obra-drift" : ""}`}
      />
    </div>
  );
}
