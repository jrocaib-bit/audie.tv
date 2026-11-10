"use client";

import { track, type ContextoMedicion, type Evento, type FilaEvento, type FilaReto, type PropsDe } from "@audite/domain";
import { supabaseWeb } from "@/lib/auth-web";

const VERSION = "0.1.0";

function sesionId(): string {
  if (typeof sessionStorage === "undefined") return "servidor";
  const guardada = sessionStorage.getItem("audite.sesion");
  if (guardada) return guardada;
  const nueva = crypto.randomUUID();
  sessionStorage.setItem("audite.sesion", nueva);
  return nueva;
}

async function contexto(): Promise<ContextoMedicion> {
  let user_id: string | null = null;
  try {
    const remoto = supabaseWeb();
    user_id = (await remoto?.auth.getSession())?.data.session?.user.id ?? null;
  } catch {
    user_id = null;
  }
  return {
    platform: "web",
    app_version: VERSION,
    locale: typeof document === "undefined" ? "es" : document.documentElement.lang || "es",
    session_id: sesionId(),
    user_id,
  };
}

export function medir<E extends Evento>(nombre: E, propiedades: PropsDe[E]): void {
  void (async () => {
    const ctx = await contexto();
    const remoto = supabaseWeb();
    track(nombre, propiedades, ctx, {
      evento: async (fila: FilaEvento) => {
        if (!remoto) return;
        await remoto.from("analytics_events").insert(fila);
      },
      progreso: async (fila: FilaReto) => {
        if (!remoto) return;
        await remoto.from("reto_progreso").upsert(fila);
      },
    });
  })().catch(() => undefined);
}
