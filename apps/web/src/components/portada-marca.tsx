/** Portada sin cuadro, solo si el episodio no tiene obra. El título llega por props. */
export function PortadaMarca({ episodioId, titulo, className = "" }: { episodioId: string; titulo?: string; lang?: "es" | "en"; className?: string }) {
  const texto = titulo?.trim() || episodioId;
  return (
    <div className={`relative flex h-full min-h-full w-full flex-col items-center justify-center overflow-hidden bg-[#100E0C] px-5 text-center ${className}`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgb(201_169_110/0.34),transparent_62%)]" aria-hidden="true" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/marca/audite_marca_oro.svg" alt="" className="relative h-14 w-14" />
      <p className="font-display relative mt-4 max-w-[16rem] text-balance text-2xl leading-tight text-[#F4ECE2]">{texto}</p>
    </div>
  );
}
