import type { Marcadores } from "./notas";
import type { ProgressState } from "./progress";

export type Proveedor = "apple" | "google" | "correo";

export type Sesion = {
  userId: string;
  email: string | null;
  proveedor: Proveedor;
};

export const AUTH_URLS = {
  sitio: "https://audite.tv",
  callbackWeb: "https://audite.tv/auth/callback",
  callbackApp: "audite://auth/callback",
  remitente: "no-reply@audite.tv",
} as const;

/** Apple y Google al mismo nivel. El correo, debajo. */
export const PROVEEDORES_ALTA: Proveedor[] = ["apple", "google", "correo"];

export type ClienteAuth = {
  signInWithIdToken: (proveedor: "apple" | "google", token: string) => Promise<Sesion>;
  signInWithOAuth: (proveedor: "apple" | "google", redirectTo: string) => Promise<{ url: string }>;
  signInWithOtp: (email: string, emailRedirectTo: string) => Promise<void>;
  getSession: () => Promise<Sesion | null>;
  signOut: () => Promise<void>;
  deleteUser: () => Promise<void>;
  subirLocal: (userId: string, carga: CargaLocal) => Promise<void>;
};

export type CargaLocal = {
  favoritos: { episodeId: string }[];
  notas: { id: string; episodeId: string; texto: string; versiculo: string | null; segundo: number | null }[];
  progreso: { episodeId: string; positionSeconds: number; completed: boolean }[];
  dias: string[];
};

export function redirectDe(origen: "web" | "app"): string {
  return origen === "app" ? AUTH_URLS.callbackApp : AUTH_URLS.callbackWeb;
}

export function correoValido(valor: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim());
}

export async function entrarConToken(cliente: ClienteAuth, proveedor: "apple" | "google", token: string): Promise<Sesion> {
  const limpio = token.trim();
  if (!limpio) throw new Error("sin-token");
  return cliente.signInWithIdToken(proveedor, limpio);
}

export async function entrarConOAuth(cliente: ClienteAuth, proveedor: "apple" | "google", origen: "web" | "app"): Promise<string> {
  const { url } = await cliente.signInWithOAuth(proveedor, redirectDe(origen));
  if (!url) throw new Error("sin-url");
  return url;
}

export async function entrarConCorreo(cliente: ClienteAuth, email: string, origen: "web" | "app"): Promise<void> {
  const limpio = email.trim();
  if (!correoValido(limpio)) throw new Error("correo");
  await cliente.signInWithOtp(limpio, redirectDe(origen));
}

export function cargaLocal(marcadores: Marcadores, progreso: ProgressState): CargaLocal {
  return {
    favoritos: marcadores.favoritos.map((favorito) => ({ episodeId: favorito.episodeId })),
    notas: marcadores.notas.map((nota) => ({
      id: nota.id,
      episodeId: nota.episodeId,
      texto: nota.texto,
      versiculo: nota.versiculo,
      segundo: nota.segundo,
    })),
    progreso: Object.entries(progreso.episodes).map(([episodeId, episodio]) => ({
      episodeId,
      positionSeconds: episodio.positionSeconds,
      completed: episodio.completed,
    })),
    dias: progreso.listenedOn ?? [],
  };
}

/** Solo el primer login sube lo local. Una cuenta ya migrada no se pisa. */
export function planDeMigracion(yaMigrado: boolean, carga: CargaLocal): CargaLocal | null {
  if (yaMigrado) return null;
  const vacia = carga.favoritos.length + carga.notas.length + carga.progreso.length + carga.dias.length === 0;
  return vacia ? null : carga;
}

export async function cerrarSesion(cliente: ClienteAuth): Promise<void> {
  await cliente.signOut();
}

export async function borrarCuenta(cliente: ClienteAuth): Promise<void> {
  await cliente.deleteUser();
  await cliente.signOut();
}
