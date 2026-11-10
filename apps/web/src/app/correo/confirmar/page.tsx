import { redirect } from "next/navigation";
import { ConfirmadoLista } from "@/components/confirmado-lista";
import { confirmarLista } from "@/lib/formularios/acciones";
import { BOTON_CONFIRMAR, MENSAJE_CADUCADO, MENSAJE_CONFIRMADA, vistaCorreo } from "@/lib/formularios/logica";

async function confirmar(datos: FormData) {
  "use server";
  if (vistaCorreo("POST") !== "ejecutar") return;
  const token = String(datos.get("t") ?? "");
  const resultado = await confirmarLista(token);
  redirect(`/correo/confirmar?t=${encodeURIComponent(token)}&hecho=${resultado}`);
}

export default async function Page({ searchParams }: { searchParams: Promise<{ t?: string; hecho?: string }> }) {
  const { t = "", hecho } = await searchParams;
  if (vistaCorreo("GET") === "ejecutar") return null;
  const listo = hecho === "ok";
  const caducado = hecho === "caducado";
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center bg-[#100E0C] px-6 text-[#F4ECE2]">
      {listo ? <ConfirmadoLista /> : null}
      <h1 className="font-display text-5xl">{listo ? "Listo" : caducado ? "Enlace caducado" : "Confirmar"}</h1>
      {hecho ? (
        <p className="mt-4 text-[#B7AB9C]">{listo ? MENSAJE_CONFIRMADA : MENSAJE_CADUCADO}</p>
      ) : (
        <form className="mt-6" action={confirmar}>
          <input type="hidden" name="t" value={t} />
          <button className="inline-flex min-h-12 items-center rounded-full bg-[#C9A96E] px-6 text-[#100E0C]" type="submit">{BOTON_CONFIRMAR}</button>
        </form>
      )}
    </main>
  );
}
