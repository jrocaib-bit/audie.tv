"use client";

import { obraDeEpisodio, obraWebp } from "@audite/content/obras";
import Link from "next/link";

export function Arte({ episodioId, className = "" }: { episodioId: string | null; className?: string }) {
  const obra = episodioId ? obraDeEpisodio(episodioId) : null;
  if (!obra) return <span className={`block bg-[#1B1815] ${className}`} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={obraWebp(obra)} alt="" className={`block object-cover ${className}`} />
  );
}

export function Candado() {
  return (
    <svg viewBox="0 0 24 24" className="size-3.5" aria-hidden="true">
      <path fill="currentColor" d="M7 10V8a5 5 0 0 1 10 0v2h1.2A1.8 1.8 0 0 1 20 11.8v7.4A1.8 1.8 0 0 1 18.2 21H5.8A1.8 1.8 0 0 1 4 19.2v-7.4A1.8 1.8 0 0 1 5.8 10H7zm2 0h6V8a3 3 0 0 0-6 0v2z" />
    </svg>
  );
}

export function EstanteFila({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6">
      <h2 className="font-display px-4 text-2xl leading-none">{titulo}</h2>
      <div className="estante mt-3 flex gap-3 overflow-x-auto px-4 pb-1">{children}</div>
    </section>
  );
}

export function TarjetaCuadro({
  href,
  episodioId,
  titulo,
  subtitulo,
  pronto,
  color,
  prontoTexto,
}: {
  href: string;
  episodioId: string | null;
  titulo: string;
  subtitulo?: string;
  pronto?: boolean;
  color?: string;
  prontoTexto: string;
}) {
  return (
    <Link href={href} className="w-[9.25rem] shrink-0 snap-start">
      <span className="relative block aspect-square overflow-hidden rounded-2xl" style={color ? { background: color } : undefined}>
        <Arte episodioId={episodioId} className="h-full w-full" />
        {pronto ? (
          <span className="absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-full bg-[#100E0C]/80 px-2 py-1 text-[10px] tracking-wide text-[#F4ECE2] uppercase">
            <Candado />
            {prontoTexto}
          </span>
        ) : null}
      </span>
      <span className="mt-2 block truncate text-sm">{titulo}</span>
      {subtitulo ? <span className="block truncate text-xs text-muted">{subtitulo}</span> : null}
    </Link>
  );
}
