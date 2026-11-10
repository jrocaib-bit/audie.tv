export const EVENTOS = [
  "page_view",
  "cta_click",
  "store_click",
  "signup_started",
  "signup_completed",
  "paywall_view",
  "plan_selected",
  "trial_started",
  "purchase_completed",
  "subscription_cancelled",
  "app_open",
  "playback_started",
  "episode_completed",
  "challenge_started",
  "challenge_day_completed",
  "challenge_completed",
  "playback_progress",
  "cta_clicked",
  "form_submitted",
  "signup_confirmed",
] as const;

export type Evento = (typeof EVENTOS)[number];

export type PropsDe = {
  page_view: { path: string };
  cta_click: { cta: string; lugar: string };
  store_click: { tienda: "apple" | "google" };
  signup_started: { proveedor: "apple" | "google" | "correo" };
  signup_completed: { proveedor: "apple" | "google" | "correo" };
  paywall_view: { origen: string };
  plan_selected: { plan: "mensual" | "anual" };
  trial_started: { plan: "mensual" | "anual" };
  purchase_completed: { plan: "mensual" | "anual" };
  subscription_cancelled: { plan: "mensual" | "anual" };
  app_open: Record<string, never>;
  playback_started: { episode_id: string };
  episode_completed: { episode_id: string };
  challenge_started: { reto_id: string };
  challenge_day_completed: { reto_id: string; dia: number; episode_id: string };
  challenge_completed: { reto_id: string };
  playback_progress: { episode_id: string; marca: 25 | 50 | 75 };
  cta_clicked: PropsFormulario;
  form_submitted: PropsFormulario;
  signup_confirmed: PropsFormulario;
};

export type PropsFormulario = {
  form_id: string;
  cta_id: string;
  ubicacion: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  idioma: string;
  plataforma: string;
  metodo?: string;
  opt_in_correo?: boolean;
};

export type Plataforma = "web" | "ios" | "android";

export type ContextoMedicion = {
  platform: Plataforma;
  app_version: string;
  locale: string;
  session_id: string;
  user_id: string | null;
};

export type FilaEvento = {
  user_id: string | null;
  session_id: string;
  platform: Plataforma;
  app_version: string;
  locale: string;
  event_name: Evento;
  properties: Record<string, unknown>;
};

export type FilaReto = {
  user_id: string;
  reto_id: string;
  dia: number;
  fecha_local: string;
  completed_at: string;
  episode_id: string | null;
};

export type SumideroMedicion = {
  evento: (fila: FilaEvento) => Promise<void> | void;
  progreso?: (fila: FilaReto) => Promise<void> | void;
};

const PII = /email|name|phone|ip|texto|versiculo/;

export function esClavePrivada(clave: string): boolean {
  const normal = clave.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  return PII.test(normal);
}

export function hostDeReferrer(valor: string): string {
  try {
    return new URL(valor).host;
  } catch {
    return "";
  }
}

export function limpiarPropiedades(valor: unknown): Record<string, unknown> {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) return {};
  const salida: Record<string, unknown> = {};
  for (const [clave, item] of Object.entries(valor as Record<string, unknown>)) {
    if (esClavePrivada(clave)) continue;
    if (/^referr?er$/i.test(clave)) {
      salida[clave] = typeof item === "string" ? hostDeReferrer(item) : "";
      continue;
    }
    if (item && typeof item === "object" && !Array.isArray(item)) {
      salida[clave] = limpiarPropiedades(item);
      continue;
    }
    salida[clave] = item;
  }
  const texto = JSON.stringify(salida);
  if (new TextEncoder().encode(texto).length >= 4096) return {};
  return salida;
}

export function esEvento(nombre: string): nombre is Evento {
  return (EVENTOS as readonly string[]).includes(nombre) && /^[a-z_]{2,48}$/.test(nombre);
}

export function eventosDePaywall(comprasActivas: boolean, accion: "ver" | "plan" | "probar" | "comprar" | "cancelar"): Evento | null {
  if (accion === "ver") return "paywall_view";
  if (accion === "plan") return "plan_selected";
  if (!comprasActivas) return null;
  if (accion === "probar") return "trial_started";
  if (accion === "comprar") return "purchase_completed";
  return "subscription_cancelled";
}

export type EstadoEscucha = { episodeId: string | null; empezado: boolean; completado: boolean; marcas: number[] };

export function estadoEscuchaVacio(): EstadoEscucha {
  return { episodeId: null, empezado: false, completado: false, marcas: [] };
}

export function decidirEscucha(estado: EstadoEscucha, ahora: { episodeId: string | null; status: string; fraccion: number }): { estado: EstadoEscucha; eventos: { nombre: "playback_started" | "episode_completed" | "playback_progress"; episode_id: string; marca?: 25 | 50 | 75 }[] } {
  if (!ahora.episodeId) return { estado: estadoEscuchaVacio(), eventos: [] };
  const mismo = estado.episodeId === ahora.episodeId ? estado : estadoEscuchaVacio();
  const siguiente: EstadoEscucha = { episodeId: ahora.episodeId, empezado: mismo.empezado, completado: mismo.completado, marcas: [...mismo.marcas] };
  const eventos: { nombre: "playback_started" | "episode_completed" | "playback_progress"; episode_id: string; marca?: 25 | 50 | 75 }[] = [];
  if (ahora.status === "playing" && !siguiente.empezado) {
    siguiente.empezado = true;
    eventos.push({ nombre: "playback_started", episode_id: ahora.episodeId });
  }
  for (const marca of [25, 50, 75] as const) {
    if (ahora.fraccion * 100 >= marca && !siguiente.marcas.includes(marca)) {
      siguiente.marcas.push(marca);
      eventos.push({ nombre: "playback_progress", episode_id: ahora.episodeId, marca });
    }
  }
  if ((ahora.status === "ended" || ahora.fraccion >= 1) && !siguiente.completado) {
    siguiente.completado = true;
    eventos.push({ nombre: "episode_completed", episode_id: ahora.episodeId });
  }
  return { estado: siguiente, eventos };
}

export function prepararMedicion<E extends Evento>(nombre: E, propiedades: PropsDe[E], ctx: ContextoMedicion, ahora = new Date()): { evento: FilaEvento; progreso: FilaReto | null } {
  if (!esEvento(nombre)) throw new Error("evento");
  const properties = limpiarPropiedades(propiedades);
  const evento: FilaEvento = {
    user_id: ctx.user_id,
    session_id: ctx.session_id,
    platform: ctx.platform,
    app_version: ctx.app_version,
    locale: ctx.locale,
    event_name: nombre,
    properties,
  };
  let progreso: FilaReto | null = null;
  if (ctx.user_id && nombre === "challenge_day_completed") {
    const datos = propiedades as PropsDe["challenge_day_completed"];
    if (datos.dia > 0) {
      progreso = {
        user_id: ctx.user_id,
        reto_id: datos.reto_id,
        dia: datos.dia,
        fecha_local: ahora.toISOString().slice(0, 10),
        completed_at: ahora.toISOString(),
        episode_id: datos.episode_id || null,
      };
    }
  }
  return { evento, progreso };
}

const CLAVES_FORMULARIO = ["form_id", "cta_id", "ubicacion", "utm_source", "utm_medium", "utm_campaign", "idioma", "plataforma", "metodo", "opt_in_correo"] as const;

export function propsFormulario(entrada: PropsFormulario): PropsFormulario {
  const limpio = limpiarPropiedades(entrada);
  const salida = {} as PropsFormulario;
  for (const clave of CLAVES_FORMULARIO) {
    if (clave in limpio) (salida as Record<string, unknown>)[clave] = limpio[clave];
  }
  return salida;
}

export function plataformaCliente(sistema: string): "ios" | "android" | "web" {
  if (sistema === "ios" || sistema === "android") return sistema;
  return "web";
}

export function utmDeBusqueda(busqueda: string): Pick<PropsFormulario, "utm_source" | "utm_medium" | "utm_campaign"> {
  const params = new URLSearchParams(busqueda.startsWith("?") ? busqueda.slice(1) : busqueda);
  const salida: Pick<PropsFormulario, "utm_source" | "utm_medium" | "utm_campaign"> = {};
  for (const clave of ["utm_source", "utm_medium", "utm_campaign"] as const) {
    const valor = params.get(clave)?.trim();
    if (valor) salida[clave] = valor.slice(0, 80);
  }
  return salida;
}

export function track<E extends Evento>(nombre: E, propiedades: PropsDe[E], ctx: ContextoMedicion, sumidero: SumideroMedicion, ahora = new Date()): void {
  try {
    const preparado = prepararMedicion(nombre, propiedades, ctx, ahora);
    const envio = sumidero.evento(preparado.evento);
    if (envio && typeof (envio as Promise<void>).then === "function") void (envio as Promise<void>).catch(() => undefined);
    if (preparado.progreso && sumidero.progreso) {
      const progreso = sumidero.progreso(preparado.progreso);
      if (progreso && typeof (progreso as Promise<void>).then === "function") void (progreso as Promise<void>).catch(() => undefined);
    }
  } catch {
    return;
  }
}

export function filaPreferenciaCorreo(userId: string, consentimiento: boolean, ahora = new Date().toISOString()) {
  return {
    user_id: userId,
    marketing_consent: consentimiento,
    consent_at: consentimiento ? ahora : null,
  };
}

export function scriptPlausible(dominio: string | null | undefined): { src: string; domain: string } | null {
  const domain = dominio?.trim() ?? "";
  if (!domain) return null;
  return { src: "https://plausible.io/js/script.js", domain };
}

export async function eliminarCuenta(cliente: {
  rpc: (nombre: string) => Promise<{ error: { message: string } | null }>;
  signOut: () => Promise<void>;
}): Promise<"hecha" | "error"> {
  try {
    const { error } = await cliente.rpc("delete_my_account");
    if (error) return "error";
    await cliente.signOut();
    return "hecha";
  } catch {
    return "error";
  }
}
