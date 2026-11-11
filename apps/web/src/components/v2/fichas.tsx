"use client";

import { esPortadaProvisional, obraDeEpisodio, obraWebp, obrasVisibles, type ObraVisible } from "@audite/content/obras";
import { PortadaMarca } from "@/components/portada-marca";
import Link from "next/link";

const PALETA = ["#1C3328", "#3A2418", "#2C3348", "#4A2C3A", "#1E3A34", "#5A4632", "#243044", "#3D2B1F", "#1F2A24", "#3A2A18", "#2A3330", "#4A3828"];

function indice(clave: string, salto: number, total: number): number {
  let n = salto + 1;
  for (let i = 0; i < clave.length; i += 1) n = (n * 33 + clave.charCodeAt(i)) % 997;
  return total === 0 ? 0 : n % total;
}

const COLORES: Record<string, string> = {
  "gn-01": "#1E4A36",
  "gn-02": "#3E2A1C",
  "gn-03": "#2A3A28",
  "gn-04": "#4A3424",
  "gn-05": "#243044",
  "gn-06": "#3A2A22",
};

export function colorDeObra(obra: ObraVisible | null): string {
  if (!obra) return PALETA[0]!;
  return COLORES[obra.episodio] ?? PALETA[indice(obra.id, obra.numero, PALETA.length)] ?? PALETA[0]!;
}

export function obrasPara(clave: string, cantidad: number): ObraVisible[] {
  const todas = obrasVisibles();
  if (todas.length === 0) return [];
  const directa = obraDeEpisodio(clave);
  const elegidas: ObraVisible[] = directa ? [directa] : [];
  let salto = 0;
  while (elegidas.length < cantidad && salto < todas.length * 2) {
    const obra = todas[indice(clave, salto, todas.length)];
    if (obra && !elegidas.some((item) => item.id === obra.id)) elegidas.push(obra);
    salto += 1;
  }
  return elegidas;
}

export function Arte({ episodioId, className = "" }: { episodioId: string | null; className?: string }) {
  if (episodioId && esPortadaProvisional(episodioId)) return <PortadaMarca episodioId={episodioId} className={className} />;
  const obra = (episodioId ? obraDeEpisodio(episodioId) : null) ?? obrasPara(episodioId || "audite", 1)[0] ?? null;
  if (!obra || esPortadaProvisional(obra.episodio)) {
    return obra ? <PortadaMarca episodioId={obra.episodio} className={className} /> : <span className={`block bg-[#1B1815] ${className}`} />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={obraWebp(obra)} alt="" width={obra.ancho} height={obra.alto} loading="lazy" decoding="async" className={`block object-cover ${className}`} />
  );
}

function Foto({ obra, className = "" }: { obra: ObraVisible; className?: string }) {
  if (esPortadaProvisional(obra.episodio)) return <PortadaMarca episodioId={obra.episodio} className={className} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={obraWebp(obra)} alt="" width={obra.ancho} height={obra.alto} loading="lazy" decoding="async" className={`block h-full w-full object-cover ${className}`} />
  );
}

export function Candado() {
  return (
    <svg viewBox="0 0 24 24" className="size-3.5" aria-hidden="true">
      <path fill="currentColor" d="M7 10V8a5 5 0 0 1 10 0v2h1.2A1.8 1.8 0 0 1 20 11.8v7.4A1.8 1.8 0 0 1 18.2 21H5.8A1.8 1.8 0 0 1 4 19.2v-7.4A1.8 1.8 0 0 1 5.8 10H7zm2 0h6V8a3 3 0 0 0-6 0v2z" />
    </svg>
  );
}

function claseTitulo(titulo: string, grande: boolean): string {
  if (grande) return titulo.length > 16 ? "text-[1.05rem]" : "text-[1.25rem]";
  if (titulo.length > 16) return "text-[0.72rem]";
  if (titulo.length > 10) return "text-sm";
  return "text-base";
}

export function EstanteFila({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-7">
      <h2 className="font-display px-4 text-2xl leading-none">{titulo}</h2>
      <div className="estante mt-3 flex gap-3 overflow-x-auto px-4 pb-1">{children}</div>
    </section>
  );
}

export function TarjetaDia({ href, titulo, subtitulo, clave, filete, calendario, oir, poster }: { href: string; titulo: string; subtitulo?: string; clave: string; filete?: string; calendario?: string; oir?: string | null; poster?: string | null }) {
  const obra = obrasPara(clave, 1)[0];
  const color = filete ?? colorDeObra(obra ?? null);
  return (
    <div className="relative mx-4 mt-5">
      <Link href={href} className={`relative block overflow-hidden rounded-2xl ${poster ? "mx-auto aspect-[9/16] w-[min(100%,calc((100dvh-16rem)*9/16))]" : "h-44"}`} style={{ background: color }}>
        {poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : obra ? <Foto obra={obra} className="absolute inset-0" /> : null}
        <span className="absolute inset-0 bg-gradient-to-t from-[#100E0C] via-[#100E0C]/45 to-transparent" />
        <span className="absolute inset-x-0 top-0 h-1.5 shadow-[0_1px_0_rgba(16,14,12,0.35)]" style={{ background: color }} />
        <span className={`absolute inset-x-4 ${poster ? "bottom-28" : "bottom-4"}`}>
          <span className="block font-display text-[clamp(1.15rem,4.6vw,1.65rem)] leading-tight text-[#F4ECE2]">{titulo}</span>
          {subtitulo ? <span className="mt-2 block text-sm whitespace-nowrap text-[#F4ECE2]/85">{subtitulo}</span> : null}
        </span>
      </Link>
      {oir ? (
        <Link href={oir} aria-label="Oír" className="absolute bottom-3 right-3 inline-flex size-11 items-center justify-center rounded-full bg-[#F4ECE2] text-[#100E0C]">
          <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true"><path fill="currentColor" d="M8 4.5v15l12-7.5z" /></svg>
        </Link>
      ) : null}
      {calendario ? (
        <Link href={calendario} aria-label="Calendario" className="absolute top-3 right-3 inline-flex size-11 items-center justify-center rounded-full bg-[#100E0C]/55 text-[#F4ECE2]">
          <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true"><path fill="none" stroke="currentColor" strokeWidth="1.7" d="M5 6h14v13H5zM8 4v4M16 4v4M5 10h14" /></svg>
        </Link>
      ) : null}
    </div>
  );
}

export function TarjetaMix({ href, titulo, clave }: { href: string; titulo: string; clave: string }) {
  const obras = obrasPara(clave, 4);
  const color = colorDeObra(obras[0] ?? null);
  return (
    <Link href={href} className="tarjeta-mix shrink-0 snap-start">
      <span className="relative block aspect-square overflow-hidden rounded-2xl" style={{ background: color }}>
        <span className="absolute inset-0 grid grid-cols-2">
          {obras.slice(0, 4).map((obra) => <Foto key={obra.id} obra={obra} />)}
        </span>
        <span className="absolute inset-0" style={{ background: `linear-gradient(180deg, transparent 36%, ${color}f2 100%)` }} />
        <span className="absolute inset-x-4 bottom-3 text-center font-display text-lg leading-tight text-[#F4ECE2]">{titulo}</span>
      </span>
    </Link>
  );
}

export function TarjetaCuadro({
  href,
  episodioId,
  titulo,
  pronto,
  prontoTexto,
  lleno = false,
}: {
  href: string;
  episodioId: string | null;
  titulo: string;
  subtitulo?: string;
  pronto?: boolean;
  color?: string;
  prontoTexto: string;
  lleno?: boolean;
}) {
  const obra = obrasPara(episodioId || titulo, 1)[0];
  const color = colorDeObra(obra ?? null);
  return (
    <Link href={href} className={`${lleno ? "w-full" : "tarjeta-par shrink-0 snap-start"}`}>
      <span className="relative block aspect-square overflow-hidden rounded-2xl" style={{ background: color }}>
        {obra ? <Foto obra={obra} className="absolute inset-0" /> : null}
      </span>
      <span className="mt-2 line-clamp-2 block text-center font-display text-sm leading-tight">{titulo}</span>
      {pronto ? <span className="sr-only">{prontoTexto}</span> : null}
    </Link>
  );
}

export function FilaContinua({
  titulo,
  tarjetas,
}: {
  titulo: string;
  tarjetas: { id: string; href: string; titulo: string; episodioId: string }[];
}) {
  if (tarjetas.length === 0) return null;
  return (
    <section className="mt-6 px-4">
      <h2 className="font-display text-2xl leading-none">{titulo}</h2>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {tarjetas.slice(0, 6).map((tarjeta) => {
          const obra = obrasPara(tarjeta.episodioId, 1)[0];
          return (
            <Link key={tarjeta.id} href={tarjeta.href} className="flex min-h-14 items-center gap-2 overflow-hidden rounded-md bg-card">
              <span className="size-14 shrink-0">{obra ? <Foto obra={obra} /> : null}</span>
              <span className="min-w-0 pr-2 font-display text-sm leading-tight">{tarjeta.titulo}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
