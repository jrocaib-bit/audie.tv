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

const DESCRIPCIONES: Record<string, Bilingue> = {
  biblia: { es: "Toda la Biblia en orden, desde el Génesis hasta el Apocalipsis.", en: "The whole Bible in order, from Genesis to Revelation." },
  genesis: { es: "Los orígenes del mundo y la historia de los patriarcas.", en: "The origins of the world and the story of the patriarchs." },
  evangelios: { es: "La vida de Jesús según Mateo, Marcos, Lucas y Juan.", en: "The life of Jesus according to Matthew, Mark, Luke and John." },
  salmos: { es: "La oración del pueblo de Dios en los Salmos.", en: "The prayer of God's people in the Psalms." },
  hechos: { es: "Los primeros pasos de la Iglesia en los Hechos de los Apóstoles.", en: "The first steps of the Church in the Acts of the Apostles." },
  apocalipsis: { es: "La visión final de la Biblia en el Apocalipsis.", en: "The closing vision of the Bible in Revelation." },
};

/** Una línea fiel al alcance del camino. */
export function descripcionCamino(def: DefCamino, lang: "es" | "en"): string {
  return DESCRIPCIONES[def.id]?.[lang] ?? def.nombre[lang];
}

/** Un episodio al día: los días del camino son sus episodios. */
export function duracionEnDias(total: number, lang: "es" | "en"): string {
  if (lang === "en") return total === 1 ? "1 day" : `${total} days`;
  return total === 1 ? "1 día" : `${total} días`;
}

export type AudioCamino = { total: number; conAudio: number; estado: "todo" | "parte" | "nada" };

/** Cuántos episodios del camino tienen audio ahora. El resto sigue en el catálogo sin audio. */
export function audioDeCamino(ids: readonly string[], grabados: readonly string[]): AudioCamino {
  const con = new Set(grabados);
  const conAudio = ids.filter((id) => con.has(id)).length;
  return { total: ids.length, conAudio, estado: conAudio === 0 ? "nada" : conAudio === ids.length ? "todo" : "parte" };
}

/** Los caminos con audio van primero y los que no tienen ninguno al final. Dentro de cada grupo se conserva el orden. */
export function ordenarPorAudio<T extends { audio: AudioCamino }>(lista: readonly T[]): T[] {
  return [...lista.filter((x) => x.audio.estado !== "nada"), ...lista.filter((x) => x.audio.estado === "nada")];
}
