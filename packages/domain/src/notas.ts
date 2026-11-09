export type Favorito = {
  episodeId: string;
  creadoEn: string;
};

export type Nota = {
  id: string;
  episodeId: string;
  versiculo: string | null;
  texto: string;
  segundo: number | null;
  creadoEn: string;
};

export type Marcadores = {
  favoritos: Favorito[];
  notas: Nota[];
};

export const CLAVE_MARCADORES = "audite.marcadores.v1";

export function marcadoresVacios(): Marcadores {
  return { favoritos: [], notas: [] };
}

export function parseMarcadores(value: unknown): Marcadores {
  if (!value || typeof value !== "object") return marcadoresVacios();
  const record = value as { favoritos?: unknown; notas?: unknown };
  const favoritos = Array.isArray(record.favoritos)
    ? record.favoritos.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const favorito = item as Partial<Favorito>;
        if (typeof favorito.episodeId !== "string") return [];
        return [{ episodeId: favorito.episodeId, creadoEn: typeof favorito.creadoEn === "string" ? favorito.creadoEn : "" }];
      })
    : [];
  const notas = Array.isArray(record.notas)
    ? record.notas.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const nota = item as Partial<Nota>;
        if (typeof nota.id !== "string" || typeof nota.episodeId !== "string" || typeof nota.texto !== "string" || !nota.texto.trim()) return [];
        const segundo = typeof nota.segundo === "number" && Number.isFinite(nota.segundo) ? Math.max(0, nota.segundo) : null;
        return [{
          id: nota.id,
          episodeId: nota.episodeId,
          versiculo: typeof nota.versiculo === "string" && nota.versiculo.trim() ? nota.versiculo.trim() : null,
          texto: nota.texto.trim(),
          segundo,
          creadoEn: typeof nota.creadoEn === "string" ? nota.creadoEn : "",
        }];
      })
    : [];
  return { favoritos, notas };
}

export function esFavorito(marcadores: Marcadores, episodeId: string): boolean {
  return marcadores.favoritos.some((favorito) => favorito.episodeId === episodeId);
}

export function alternarFavorito(marcadores: Marcadores, episodeId: string, ahora: string): Marcadores {
  if (esFavorito(marcadores, episodeId)) {
    return { ...marcadores, favoritos: marcadores.favoritos.filter((favorito) => favorito.episodeId !== episodeId) };
  }
  return { ...marcadores, favoritos: [...marcadores.favoritos, { episodeId, creadoEn: ahora }] };
}

export function agregarNota(
  marcadores: Marcadores,
  nota: Omit<Nota, "id" | "creadoEn"> & { id?: string },
  ahora: string,
): Marcadores | null {
  const texto = nota.texto.trim();
  if (!texto || !nota.episodeId) return null;
  const siguiente: Nota = {
    id: nota.id ?? `nota-${ahora}`,
    episodeId: nota.episodeId,
    versiculo: nota.versiculo?.trim() || null,
    texto,
    segundo: nota.segundo == null ? null : Math.max(0, nota.segundo),
    creadoEn: ahora,
  };
  return { ...marcadores, notas: [siguiente, ...marcadores.notas] };
}

export function borrarNota(marcadores: Marcadores, id: string): Marcadores {
  return { ...marcadores, notas: marcadores.notas.filter((nota) => nota.id !== id) };
}

export function notasDe(marcadores: Marcadores, episodeId: string): Nota[] {
  return marcadores.notas.filter((nota) => nota.episodeId === episodeId);
}
