import Link from "next/link";
import { BloqueTitular } from "@/components/titular";

export function AvisoLegal() {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-2xl bg-[#100E0C] px-6 py-16 text-[#F4ECE2]">
      <h1 className="font-display text-5xl leading-none">Aviso legal</h1>
      <p className="mt-4 text-[#B7AB9C]">Última actualización: 11 de noviembre de 2026.</p>
      <BloqueTitular />
      <p className="mt-8">Audite es un servicio de escucha de la Biblia. La web no cobra. La suscripción de la app se contrata en el App Store.</p>
      <p className="mt-3">Más detalle sobre los datos está en <Link className="underline" href="/privacidad">Privacidad</Link>.</p>
    </main>
  );
}
