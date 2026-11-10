import { MENSAJE_CADUCADO, MENSAJE_CONFIRMADA } from "@/lib/formularios/logica";
import { confirmarLista } from "@/lib/formularios/acciones";
import { ConfirmadoLista } from "@/components/confirmado-lista";

export default async function Page({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const token = (await searchParams).t ?? "";
  const resultado = token ? await confirmarLista(token) : "caducado";
  const listo = resultado === "ok";
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center bg-[#100E0C] px-6 text-[#F4ECE2]">
      {listo ? <ConfirmadoLista /> : null}
      <h1 className="font-display text-5xl">{listo ? "Listo" : "Enlace caducado"}</h1>
      <p className="mt-4 text-[#B7AB9C]">{listo ? MENSAJE_CONFIRMADA : MENSAJE_CADUCADO}</p>
    </main>
  );
}
