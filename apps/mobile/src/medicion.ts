import { clasificarTrafico, crearSumideroSupabase, track, type ClienteMedicion, type ContextoMedicion, type Evento, type PropsDe } from "@audite/domain";
import { Platform } from "react-native";
import { supabaseApp } from "./auth";

const VERSION = "0.1.0";
let sesion = "";

function sesionId(): string {
  if (!sesion) sesion = "xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx".replace(/x/g, () => Math.floor(Math.random() * 16).toString(16));
  return sesion;
}

function plataforma(): ContextoMedicion["platform"] {
  if (Platform.OS === "ios" || Platform.OS === "android") return Platform.OS;
  return "web";
}

export function medir<E extends Evento>(nombre: E, propiedades: PropsDe[E]): void {
  void (async () => {
    let user_id: string | null = null;
    let email: string | null = null;
    try {
      const usuario = (await supabaseApp()?.auth.getSession())?.data.session?.user;
      user_id = usuario?.id ?? null;
      email = usuario?.email ?? null;
    } catch {
      user_id = null;
    }
    track(nombre, propiedades, {
      platform: plataforma(),
      app_version: VERSION,
      locale: "es",
      session_id: sesionId(),
      user_id,
      trafico: clasificarTrafico({ email }),
    }, crearSumideroSupabase(supabaseApp() as unknown as ClienteMedicion | null), new Date(), (f) => console.warn("[medicion]", f.donde, f.evento, f.codigo));
  })().catch(() => console.warn("[medicion] contexto"));
}
