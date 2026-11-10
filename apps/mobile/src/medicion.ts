import { track, type ContextoMedicion, type Evento, type FilaEvento, type FilaReto, type PropsDe } from "@audite/domain";
import { Platform } from "react-native";
import { supabaseApp } from "./auth";

const VERSION = "0.1.0";
let sesion = "";

function sesionId(): string {
  if (!sesion) sesion = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return sesion;
}

function plataforma(): ContextoMedicion["platform"] {
  if (Platform.OS === "ios" || Platform.OS === "android") return Platform.OS;
  return "web";
}

export function medir<E extends Evento>(nombre: E, propiedades: PropsDe[E]): void {
  void (async () => {
    let user_id: string | null = null;
    try {
      user_id = (await supabaseApp()?.auth.getSession())?.data.session?.user.id ?? null;
    } catch {
      user_id = null;
    }
    const remoto = supabaseApp();
    track(nombre, propiedades, {
      platform: plataforma(),
      app_version: VERSION,
      locale: "es",
      session_id: sesionId(),
      user_id,
    }, {
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
