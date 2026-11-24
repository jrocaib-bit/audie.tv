import Link from "next/link";
import { Mark } from "@/components/brand";
import { BotonOro } from "@/components/sala/boton-oro";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-[#0C0B09] px-6 py-16 text-center text-[#F4ECE2]">
      <Mark className="h-16 w-16" tono="oro" />
      <h1 className="font-display t-h1 mt-8 max-w-md">Esta página no está en la sala</h1>
      <p className="mt-3 max-w-sm text-[#B7AB9C]">This page is not in the gallery.</p>
      <div className="mt-8 flex flex-col items-center gap-2">
        <BotonOro asChild><Link href="/es">Volver al inicio</Link></BotonOro>
        <Link href="/es/catalogo" className="inline-flex min-h-11 items-center text-[#C9A96E] underline">Ir al catálogo</Link>
      </div>
    </main>
  );
}
