export type MetadatosReproduccion = {
  titulo: string;
  libro: string;
  artista: string;
  caratula: string | null;
  duracion: number;
  posicion: number;
  velocidad: number;
};

export const SALTO_SEGUNDOS = 15;

export function metadatosReproduccion(entrada: {
  titulo: string;
  libro: string;
  caratula?: string | null;
  duracion: number;
  posicion: number;
  velocidad: number;
}): MetadatosReproduccion {
  return {
    titulo: entrada.titulo.trim() || "Audite",
    libro: entrada.libro.trim(),
    artista: "Audite",
    caratula: entrada.caratula || null,
    duracion: Math.max(0, entrada.duracion),
    posicion: Math.min(Math.max(0, entrada.posicion), Math.max(0, entrada.duracion)),
    velocidad: entrada.velocidad > 0 ? entrada.velocidad : 1,
  };
}

export function posicionTrasSalto(posicion: number, delta: number, duracion: number): number {
  const tope = duracion > 0 ? duracion : Number.POSITIVE_INFINITY;
  const siguiente = (Number.isFinite(posicion) ? posicion : 0) + delta;
  return Math.min(tope, Math.max(0, siguiente));
}
