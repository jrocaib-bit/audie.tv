"use client";

import { obraDeEpisodio, obraWebp, obrasVisibles, type ObraVisible } from "@audite/content/obras";
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
  const obra = (episodioId ? obraDeEpisodio(episodioId) : null) ?? obrasPara(episodioId || "audite", 1)[0] ?? null;
  if (!obra) return <span className={`block bg-[#1B1815] ${className}`} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={obraWebp(obra)} alt="" className={`block object-cover ${className}`} />
  );
}

function Foto({ obra, className = "" }: { obra: ObraVisible; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={obraWebp(obra)} alt="" className={`block h-full w-full object-cover ${className}`} />
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

export function TarjetaDia({ href, titulo, subtitulo, clave }: { href: string; titulo: string; subtitulo?: string; clave: string }) {
  const obra = obrasPara(clave, 1)[0];
  const color = colorDeObra(obra ?? null);
  return (
    <Link href={href} className="relative mx-4 mt-5 block h-44 overflow-hidden rounded-2xl" style={{ background: color }}>
      {obra ? <Foto obra={obra} className="absolute inset-0" /> : null}
      <span className="absolute inset-0" style={{ background: `linear-gradient(100deg, ${color} 0%, ${color}d0 28%, transparent 68%)` }} />
      <span className="absolute inset-y-0 left-0 flex w-[70%] flex-col justify-end p-4">
        <span className={`font-display leading-none whitespace-nowrap text-[#F4ECE2] ${claseTitulo(titulo, true)}`}>{titulo}</span>
        {subtitulo ? <span className="mt-2 truncate text-sm text-[#F4ECE2]/80">{subtitulo}</span> : null}
      </span>
    </Link>
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
        <span className={`absolute inset-x-8 bottom-3 text-center font-display leading-none whitespace-nowrap text-[#F4ECE2] ${claseTitulo(titulo, true)}`}>{titulo}</span>
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
        {pronto ? (
          <span className="absolute top-2 right-2 inline-flex size-7 items-center justify-center rounded-full bg-[#100E0C]/75 text-[#F4ECE2]">
            <Candado />
            <span className="sr-only">{prontoTexto}</span>
          </span>
        ) : null}
      </span>
      <span className={`mt-2 block text-center font-display leading-none whitespace-nowrap ${claseTitulo(titulo, false)}`}>{titulo}</span>
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
