import retosJson from "../../../content/tiempos/retos.json";
import profecias from "./datos/reto-profecias-pasion.json";

type Idioma = "es" | "en";
export type Paso = {
  dia: number;
  episodio?: string;
  obra?: string;
  minutos?: number;
  titulo: { es: string; en: string };
  /** Solo en retos de profecías: referencias, nunca texto bíblico. */
  profecia?: string;
  /** Todas las parejas profecía → cumplimiento del día (la primera es `profecia`/`cumplimiento`). */
  referencias?: { profecia: string; cumplimiento: string }[];
  diaLiturgico?: string;
  cumplimiento?: string;
  nota?: string;
  relacionados?: string[];
};
export type RetoJson = { id: string; tiempo: string; titulo: { es: string; en: string }; tituloCorto?: { es: string; en: string }; insignia?: { es: string; en: string }; obra: string; pasos: Paso[]; sinObra?: boolean };

type DiaPP = {
  id: string;
  dia: number;
  titulo: { es: string };
  dia_liturgico?: string;
  referencias: { profecia: string; cumplimiento: string }[];
  nota: string;
  episodios_relacionados: string[];
  minutos?: number | null;
};

/** Profecías de la Pasión: solo en español, sin audio todavía. Portada e imágenes de cada día van en el bundle. */
export const PROFECIAS_ID = "profecias-pasion";
const RETO_PROFECIAS: RetoJson = {
  id: PROFECIAS_ID,
  tiempo: "semana-santa",
  titulo: { es: profecias.nombre.es, en: "Prophecies of the Passion" },
  insignia: { es: "Cordero", en: "Lamb" },
  obra: "",
  pasos: (profecias.dias as DiaPP[]).map((d) => ({
    dia: d.dia,
    episodio: d.id,
    titulo: { es: d.titulo.es, en: d.titulo.es },
    minutos: d.minutos ?? undefined,
    profecia: d.referencias[0]?.profecia,
    cumplimiento: d.referencias[0]?.cumplimiento,
    referencias: d.referencias,
    diaLiturgico: d.dia_liturgico,
    nota: d.nota,
    relacionados: d.episodios_relacionados,
  })),
};

/** Retos que conoce la app: los compartidos con la web más los propios de la app. */
export const RETOS_APP: RetoJson[] = [...(retosJson.retos as unknown as RetoJson[]), RETO_PROFECIAS];

export function fechaDeDiaProfecias(dia: number): string | undefined {
  return (profecias.dias as { dia: number; fecha: string }[]).find((d) => d.dia === dia)?.fecha;
}

export type { Idioma };
