import { obraAvif, obraWebp, rotuloObra, type ObraVisible } from "@audite/content/obras";

export function Placa({ obra, lang }: { obra: ObraVisible; lang: "es" | "en" }) {
  const otro = lang === "en" ? "es" : "en";
  const marca = (codigo: "es" | "en") => (obra.detalle ? (codigo === "es" ? " (detalle)" : " (detail)") : "");
  return (
    <figure className="max-w-xl border-l-[3px] border-[#C9A96E] bg-[#100E0C]/85 px-4 py-3 text-[#F4ECE2]">
      <figcaption>
        <p className="kicker text-[#C9A96E]">{rotuloObra(obra, lang)}</p>
        <p className="font-display mt-2 text-[1.35rem] leading-tight">
          {obra.titulo[lang]}
          {marca(lang)}
        </p>
        <p className="mt-1 text-sm text-[#F4ECE2]">
          {obra.autor[lang]} · {obra.fecha}
        </p>
        <p className="text-sm text-[#B7AB9C]">{obra.ubicacion[lang]}</p>
        <div className="my-3 h-px w-12 bg-[#C9A96E]" />
        <p className="text-sm italic text-[#F4ECE2]">
          {obra.titulo[otro]}
          {marca(otro)}
        </p>
        <p className="text-sm text-[#B7AB9C]">
          {obra.autor[otro]} · {obra.fecha} · {obra.ubicacion[otro]}
        </p>
      </figcaption>
    </figure>
  );
}

export function ObraFoto({
  obra,
  priority = false,
  className = "h-full w-full object-cover",
  mover = false,
}: {
  obra: ObraVisible;
  priority?: boolean;
  className?: string;
  mover?: boolean;
}) {
  return (
    <picture className="block h-full w-full">
      <source type="image/avif" srcSet={obraAvif(obra)} />
      <img
        src={obraWebp(obra)}
        alt=""
        width={obra.ancho}
        height={obra.alto}
        fetchPriority={priority ? "high" : "auto"}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className={`${className} ${mover ? "obra-drift" : ""}`}
      />
    </picture>
  );
}
