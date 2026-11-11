export type UsuarioAudio = { email: string | null; subscriptionStatus: string | null };

export function idsGratis(valor: string | undefined): Set<string> {
  return new Set((valor ?? "").split(",").map((id) => id.trim()).filter(Boolean));
}

export function puedeEscuchar(usuario: UsuarioAudio, modo: string | undefined, permitidos: string | undefined): boolean {
  const acceso = (modo ?? "").trim().toLowerCase();
  if (acceso === "internos") {
    const lista = new Set((permitidos ?? "").split(",").map((correo) => correo.trim().toLowerCase()).filter(Boolean));
    const email = usuario.email?.trim().toLowerCase() ?? "";
    return Boolean(email) && lista.has(email);
  }
  if (acceso === "suscripcion") return usuario.subscriptionStatus === "active";
  return false;
}

export function destinoSiFalla(estado: number, lang: "es" | "en"): string | null {
  if (estado === 401) return `/${lang}/entrar`;
  if (estado === 403) return `/${lang}/membresia`;
  return null;
}
