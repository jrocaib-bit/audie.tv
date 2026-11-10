import { AUTH_URLS, cargaLocal, planDeMigracion, type Sesion } from "@audite/domain";
import { CLAVE_MARCADORES, parseMarcadores } from "@audite/domain";
import { STORAGE_KEYS, parseProgress } from "@audite/domain";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function credencialesWeb(): { url: string; anon: string } {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "",
    anon: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "",
  };
}

let cliente: SupabaseClient | null = null;

export function supabaseWeb(): SupabaseClient | null {
  const { url, anon } = credencialesWeb();
  if (!url || !anon || typeof window === "undefined") return null;
  cliente ??= createClient(url, anon, {
    auth: { persistSession: true, detectSessionInUrl: true, flowType: "pkce" },
  });
  return cliente;
}

export async function entrarOAuth(proveedor: "apple" | "google"): Promise<void> {
  const remoto = supabaseWeb();
  if (!remoto) throw new Error("sin-config");
  const { data, error } = await remoto.auth.signInWithOAuth({
    provider: proveedor,
    options: { redirectTo: AUTH_URLS.callbackWeb },
  });
  if (error || !data.url) throw new Error(error?.message ?? "sin-url");
  window.location.assign(data.url);
}

export async function entrarCorreo(email: string): Promise<void> {
  const remoto = supabaseWeb();
  if (!remoto) throw new Error("sin-config");
  const { error } = await remoto.auth.signInWithOtp({
    email: email.trim(),
    options: { emailRedirectTo: AUTH_URLS.callbackWeb },
  });
  if (error) throw new Error(error.message);
}

export async function sesionWeb(): Promise<Sesion | null> {
  const remoto = supabaseWeb();
  if (!remoto) return null;
  const { data } = await remoto.auth.getSession();
  const user = data.session?.user;
  if (!user) return null;
  return { userId: user.id, email: user.email ?? null, proveedor: "correo" };
}

export async function cerrarWeb(): Promise<void> {
  await supabaseWeb()?.auth.signOut();
}

export async function borrarWeb(): Promise<void> {
  const remoto = supabaseWeb();
  const { url, anon } = credencialesWeb();
  if (!remoto) throw new Error("sin-config");
  const { data } = await remoto.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("sin-sesion");
  const respuesta = await fetch(`${url}/rest/v1/rpc/delete_own_account`, {
    method: "POST",
    headers: { apikey: anon, Authorization: `Bearer ${token}`, "content-type": "application/json" },
  });
  if (!respuesta.ok) throw new Error("borrar");
  await remoto.auth.signOut();
}

export async function migrarWeb(): Promise<void> {
  const remoto = supabaseWeb();
  if (!remoto) return;
  const { data } = await remoto.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) return;
  const clave = `audite.migrado.${userId}`;
  if (window.localStorage.getItem(clave)) return;
  const marcadores = parseMarcadores(JSON.parse(window.localStorage.getItem(CLAVE_MARCADORES) || "null"));
  const progreso = parseProgress(JSON.parse(window.localStorage.getItem(STORAGE_KEYS.progress) || "null"));
  const plan = planDeMigracion(false, cargaLocal(marcadores, progreso));
  if (plan) {
    if (plan.favoritos.length) {
      await remoto.from("favoritos").upsert(plan.favoritos.map((item) => ({ user_id: userId, episode_id: item.episodeId })));
    }
    if (plan.notas.length) {
      await remoto.from("notas").insert(plan.notas.map((item) => ({ user_id: userId, episode_id: item.episodeId, texto: item.texto, versiculo: item.versiculo, segundo: item.segundo })));
    }
    if (plan.progreso.length) {
      await remoto.from("listening_progress").upsert(plan.progreso.map((item) => ({ user_id: userId, episode_id: item.episodeId, position_seconds: item.positionSeconds, completed: item.completed })));
    }
    if (plan.dias.length) {
      await remoto.from("listening_days").upsert(plan.dias.map((day) => ({ user_id: userId, day })));
    }
  }
  window.localStorage.setItem(clave, "1");
}
