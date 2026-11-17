import tabla from "@/data/bucles.json";

/**
 * Hueco para el bucle de cada episodio.
 * Los archivos viven fuera del repo (04_arte/animado/web/INDICE.md).
 * La clave es el id del episodio. Vacío: se queda el cuadro estático.
 */
export type BucleCrudo = {
  mp4?: string;
  webm?: string;
  poster?: string;
  mp4_1280?: string;
  webm_1280?: string;
  poster_1280?: string;
  alt?: string;
};

export type Bucle = {
  mp4: string;
  webm: string;
  poster: string;
  mp4Movil: string;
  webmMovil: string;
  posterMovil: string;
  alt: string;
};

function texto(valor: string | undefined): string {
  return (valor ?? "").trim();
}

function armar(fila: BucleCrudo | undefined, alt = ""): Bucle | null {
  const mp4 = texto(fila?.mp4);
  const webm = texto(fila?.webm);
  if (!mp4 && !webm) return null;
  return {
    mp4,
    webm,
    poster: texto(fila?.poster) || texto(fila?.poster_1280),
    mp4Movil: texto(fila?.mp4_1280),
    webmMovil: texto(fila?.webm_1280),
    posterMovil: texto(fila?.poster_1280),
    alt: texto(fila?.alt) || alt,
  };
}

export function bucleDeEpisodio(id: string): Bucle | null {
  const fila = (tabla as Record<string, BucleCrudo>)[id];
  return armar(fila);
}

/** El hero puede sustituir el cuadro de gn-01 con variables NEXT_PUBLIC_BUCLE_HERO_*. */
export function bucleDeHero(id: string, env: Record<string, string | undefined> = process.env): Bucle | null {
  const base = (tabla as Record<string, BucleCrudo>)[id] ?? {};
  return armar({
    mp4: texto(env.NEXT_PUBLIC_BUCLE_HERO_MP4) || base.mp4,
    webm: texto(env.NEXT_PUBLIC_BUCLE_HERO_WEBM) || base.webm,
    poster: texto(env.NEXT_PUBLIC_BUCLE_HERO_POSTER) || base.poster,
    mp4_1280: texto(env.NEXT_PUBLIC_BUCLE_HERO_MP4_1280) || base.mp4_1280,
    webm_1280: texto(env.NEXT_PUBLIC_BUCLE_HERO_WEBM_1280) || base.webm_1280,
    poster_1280: texto(env.NEXT_PUBLIC_BUCLE_HERO_POSTER_1280) || base.poster_1280,
    alt: base.alt,
  });
}
