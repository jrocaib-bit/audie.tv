"use client";

import { eliminarCuenta } from "@audite/domain";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabaseWeb } from "@/lib/auth-web";

export default function Page() {
  const router = useRouter();
  const [dentro, setDentro] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [aviso, setAviso] = useState("");
  useEffect(() => {
    void supabaseWeb()?.auth.getSession().then(({ data }) => setDentro(Boolean(data.session))).catch(() => setDentro(false));
  }, []);

  async function borrar() {
    const remoto = supabaseWeb();
    const resultado = await eliminarCuenta({
      rpc: async (nombre) => {
        if (!remoto) return { error: { message: "sin-config" } };
        const respuesta = await remoto.rpc(nombre);
        return { error: respuesta.error ? { message: respuesta.error.message } : null };
      },
      signOut: async () => {
        await remoto?.auth.signOut();
      },
    });
    if (resultado === "hecha") {
      router.push("/es/entrar");
      return;
    }
    setAviso("No se ha podido borrar.");
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center bg-[#100E0C] px-6 text-[#F4ECE2]">
      <h1 className="font-display text-5xl">Cuenta</h1>
      <Link href="/es/entrar" className="mt-8 inline-flex min-h-12 items-center rounded-full bg-[#C9A96E] px-6 text-[#100E0C]">Entrar</Link>
      {dentro ? (
        confirmar ? (
          <button type="button" className="mt-6 inline-flex min-h-12 items-center" onClick={() => void borrar()}>Sí, eliminar la cuenta</button>
        ) : (
          <button type="button" className="mt-6 inline-flex min-h-12 items-center" onClick={() => setConfirmar(true)}>Eliminar cuenta</button>
        )
      ) : null}
      {aviso ? <p className="mt-4 text-[#C9A96E]">{aviso}</p> : null}
    </main>
  );
}
