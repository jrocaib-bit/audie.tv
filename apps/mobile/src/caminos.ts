import { obraDeEpisodio, obraWebp } from "../../../packages/content/src/obras-visibles";

export type Rango = { id: string; bookId: string; orden: number; rango: string };
export type Bilingue = { es: string; en: string };

export type DefCamino = {
  id: string;
  nombre: Bilingue;
  /** null = todos los libros, en el orden de la Escritura. */
  libros: string[] | null;
  /** Episodio cuya obra ilustra el camino. Distinto en cada camino. */
  portada: string;
};

export const CAMINOS: DefCamino[] = [
  { id: "biblia", nombre: { es: "La Biblia entera", en: "The whole Bible" }, libros: null, portada: "gn-02" },
  { id: "genesis", nombre: { es: "Génesis", en: "Genesis" }, libros: ["gn"], portada: "gn-14" },
  { id: "evangelios", nombre: { es: "Evangelios", en: "Gospels" }, libros: ["mt", "mc", "lc", "jn"], portada: "jn-01" },
  { id: "salmos", nombre: { es: "Salmos", en: "Psalms" }, libros: ["sal"], portada: "sal-001" },
  { id: "hechos", nombre: { es: "Hechos", en: "Acts" }, libros: ["hch"], portada: "hch-01" },
  { id: "apocalipsis", nombre: { es: "Apocalipsis", en: "Revelation" }, libros: ["ap"], portada: "ap-01" },
];

export function idsDeCamino(def: DefCamino, rangos: readonly Rango[]): string[] {
  const libros = def.libros;
  return rangos.filter((rango) => !libros || libros.includes(rango.bookId)).map((rango) => rango.id);
}

/** Solo los caminos que tienen episodios en el catálogo. */
export function caminosDisponibles(rangos: readonly Rango[]): DefCamino[] {
  return CAMINOS.filter((def) => idsDeCamino(def, rangos).length > 0);
}

export function caminoPorId(id: string, rangos: readonly Rango[]): DefCamino {
  const lista = caminosDisponibles(rangos);
  return lista.find((def) => def.id === id) ?? lista[0] ?? CAMINOS[0]!;
}

export type ProgresoCamino = { total: number; hechos: number; fraccion: number; siguiente: string | null };

type Avance = { episodes: Record<string, { completed: boolean } | undefined> };

export function progresoCamino(ids: readonly string[], progress: Avance): ProgresoCamino {
  const hechos = ids.filter((id) => progress.episodes[id]?.completed).length;
  const siguiente = ids.find((id) => !progress.episodes[id]?.completed) ?? null;
  return { total: ids.length, hechos, fraccion: ids.length === 0 ? 0 : hechos / ids.length, siguiente };
}

export function portadaDeCamino(def: DefCamino): string {
  const obra = obraDeEpisodio(def.portada);
  return obra ? obraWebp(obra) : "";
}
