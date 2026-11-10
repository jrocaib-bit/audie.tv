import { AUTH_URLS, cargaLocal, planDeMigracion, type Sesion } from "@audite/domain";
import { CLAVE_MARCADORES, parseMarcadores } from "@audite/domain";
import { STORAGE_KEYS, parseProgress } from "@audite/domain";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import * as AppleAuthentication from "expo-apple-authentication";

export function credencialesApp(): { url: string; anon: string } {
  return {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? "",
    anon: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "",
  };
}

let cliente: SupabaseClient | null = null;

export function supabaseApp(): SupabaseClient | null {
  const { url, anon } = credencialesApp();
  if (!url || !anon) return null;
  cliente ??= createClient(url, anon, {
    auth: {
      storage: AsyncStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
  return cliente;
}

export async function entrarApple(): Promise<Sesion> {
  const remoto = supabaseApp();
  if (!remoto) throw new Error("sin-config");
  const credencial = await AppleAuthentication.signInAsync({
    requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
  });
  if (!credencial.identityToken) throw new Error("sin-token");
  const { data, error } = await remoto.auth.signInWithIdToken({ provider: "apple", token: credencial.identityToken });
  if (error || !data.user) throw new Error(error?.message ?? "apple");
  await migrarApp(data.user.id);
  return { userId: data.user.id, email: data.user.email ?? null, proveedor: "apple" };
}

export async function entrarGoogle(idToken: string): Promise<Sesion> {
  const remoto = supabaseApp();
  if (!remoto) throw new Error("sin-config");
  const token = idToken.trim();
  if (!token) throw new Error("sin-token");
  const { data, error } = await remoto.auth.signInWithIdToken({ provider: "google", token });
  if (error || !data.user) throw new Error(error?.message ?? "google");
  await migrarApp(data.user.id);
  return { userId: data.user.id, email: data.user.email ?? null, proveedor: "google" };
}

export async function entrarCorreoApp(email: string): Promise<void> {
  const remoto = supabaseApp();
  if (!remoto) throw new Error("sin-config");
  const { error } = await remoto.auth.signInWithOtp({
    email: email.trim(),
    options: { emailRedirectTo: AUTH_URLS.callbackApp },
  });
  if (error) throw new Error(error.message);
}

export async function sesionApp(): Promise<Sesion | null> {
  const remoto = supabaseApp();
  if (!remoto) return null;
  const { data } = await remoto.auth.getSession();
  const user = data.session?.user;
  if (!user) return null;
  return { userId: user.id, email: user.email ?? null, proveedor: "correo" };
}

export async function cerrarApp(): Promise<void> {
  await supabaseApp()?.auth.signOut();
}

export async function borrarApp(): Promise<void> {
  const remoto = supabaseApp();
  const { url, anon } = credencialesApp();
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

async function migrarApp(userId: string): Promise<void> {
  const remoto = supabaseApp();
  if (!remoto) return;
  const clave = `audite.migrado.${userId}`;
  if (await AsyncStorage.getItem(clave)) return;
  const marcadores = parseMarcadores(JSON.parse((await AsyncStorage.getItem(CLAVE_MARCADORES)) || "null"));
  const progreso = parseProgress(JSON.parse((await AsyncStorage.getItem(STORAGE_KEYS.progress)) || "null"));
  const plan = planDeMigracion(false, cargaLocal(marcadores, progreso));
  if (plan) {
    if (plan.favoritos.length) await remoto.from("favoritos").upsert(plan.favoritos.map((item) => ({ user_id: userId, episode_id: item.episodeId })));
    if (plan.notas.length) await remoto.from("notas").insert(plan.notas.map((item) => ({ user_id: userId, episode_id: item.episodeId, texto: item.texto, versiculo: item.versiculo, segundo: item.segundo })));
    if (plan.progreso.length) await remoto.from("listening_progress").upsert(plan.progreso.map((item) => ({ user_id: userId, episode_id: item.episodeId, position_seconds: item.positionSeconds, completed: item.completed })));
    if (plan.dias.length) await remoto.from("listening_days").upsert(plan.dias.map((day) => ({ user_id: userId, day })));
  }
  await AsyncStorage.setItem(clave, "1");
}
