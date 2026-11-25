/** Qué trae un enlace de acceso de Supabase (query o hash). */
export type CargaEnlaceAuth =
  | { tipo: "code"; code: string }
  | { tipo: "token_hash"; tokenHash: string; otpType: "email" | "magiclink" | "signup" | "recovery" | "invite" }
  | { tipo: "tokens"; accessToken: string; refreshToken: string };

const OTP_TIPOS = ["email", "magiclink", "signup", "recovery", "invite"] as const;

function esOtpTipo(valor: string): valor is (typeof OTP_TIPOS)[number] {
  return (OTP_TIPOS as readonly string[]).includes(valor);
}

/** Junta parámetros de la query y del hash, sin lanzar si la URL es un scheme propio. */
export function paramsDeEnlaceAuth(url: string): Record<string, string> {
  const recorte = url.trim();
  if (!recorte) return {};
  const corteHash = recorte.indexOf("#");
  const sinHash = corteHash >= 0 ? recorte.slice(0, corteHash) : recorte;
  const hash = corteHash >= 0 ? recorte.slice(corteHash + 1) : "";
  const corteQuery = sinHash.indexOf("?");
  const query = corteQuery >= 0 ? sinHash.slice(corteQuery + 1) : "";
  const out: Record<string, string> = {};
  for (const parte of [query, hash]) {
    if (!parte) continue;
    for (const [clave, valor] of new URLSearchParams(parte)) {
      if (clave && valor) out[clave] = valor;
    }
  }
  return out;
}

export function esEnlaceAuth(url: string): boolean {
  const limpio = url.trim().toLowerCase();
  if (!limpio) return false;
  return (
    limpio.startsWith("audite://auth/callback") ||
    limpio.includes("://audite.tv/auth/callback") ||
    limpio.includes("://www.audite.tv/auth/callback")
  );
}

export function parsearEnlaceAuth(url: string): CargaEnlaceAuth | null {
  if (!esEnlaceAuth(url)) return null;
  const p = paramsDeEnlaceAuth(url);
  const code = p.code?.trim();
  if (code) return { tipo: "code", code };
  const tokenHash = (p.token_hash ?? p.tokenHash)?.trim();
  if (tokenHash) {
    const raw = (p.type ?? "email").trim().toLowerCase();
    return { tipo: "token_hash", tokenHash, otpType: esOtpTipo(raw) ? raw : "email" };
  }
  const accessToken = p.access_token?.trim();
  const refreshToken = p.refresh_token?.trim();
  if (accessToken && refreshToken) return { tipo: "tokens", accessToken, refreshToken };
  return null;
}
