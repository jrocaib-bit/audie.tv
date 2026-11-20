/** Episodio que carga el reproductor. Se guarda como texto plano (id). */
export function parseEpisodioActual(valor: unknown, validos: readonly string[], porDefecto: string | null): string | null {
  if (typeof valor === "string") {
    const limpio = valor.trim().replace(/^"|"$/g, "");
    if (validos.includes(limpio)) return limpio;
  }
  return porDefecto;
}

type Avance = { positionSeconds: number; updatedAt: string; completed: boolean };

/** Episodio a medias más reciente (si lo hay). */
export function episodioAMedias(episodios: Record<string, Avance | undefined>, excluir?: string | null): string | null {
  let mejor: { id: string; en: string } | null = null;
  for (const [id, a] of Object.entries(episodios)) {
    if (!a || a.completed || a.positionSeconds < 1 || id === excluir) continue;
    if (!mejor || a.updatedAt > mejor.en) mejor = { id, en: a.updatedAt };
  }
  return mejor?.id ?? null;
}
