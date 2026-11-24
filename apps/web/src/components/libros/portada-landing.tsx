import { archivoPortada } from "@audite/domain";

const SIZES = "(min-width: 768px) 320px, 144px";
const url = (volumen: number, formato: "avif" | "webp", ancho: 480 | 960) => `/api/libros/portada/${archivoPortada("cubierta", volumen, formato, ancho)}`;

/** Cubierta de la landing. `priority` solo aquí: es la imagen que más pesa en la primera pantalla. */
export function PortadaLanding({ volumen, alt }: { volumen: number; alt: string }) {
  const srcset = (formato: "avif" | "webp") => `${url(volumen, formato, 480)} 480w, ${url(volumen, formato, 960)} 960w`;
  return (
    <picture>
      <source type="image/avif" srcSet={srcset("avif")} sizes={SIZES} />
      <source type="image/webp" srcSet={srcset("webp")} sizes={SIZES} />
      <img
        src={url(volumen, "webp", 480)}
        width={480}
        height={720}
        alt={alt}
        loading="eager"
        decoding="async"
        fetchPriority="high"
        data-portada=""
        className="h-auto w-full rounded-[4px] border border-[#C9A96E]/35 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.9)]"
      />
    </picture>
  );
}
