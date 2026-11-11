export type LibroPublico = { id: string; testament: "ot" | "nt"; order: number };

const INICIO: Record<string, string> = {
  "adviento-isaias": "2026-11-29",
  "navidad-infancia": "2026-12-25",
  "cuaresma-40": "2027-02-10",
  "semana-santa-pasion": "2027-03-21",
  "pascua-hechos": "2027-03-28",
};

const FIN: Record<string, string> = {
  "adviento-isaias": "2026-12-24",
  "navidad-infancia": "2027-01-10",
  "cuaresma-40": "2027-03-21",
  "semana-santa-pasion": "2027-03-28",
  "pascua-hechos": "2027-05-16",
};

const ESTACIONAL = new Set(["adviento", "navidad", "cuaresma", "semana-santa", "pascua"]);

export function agruparLibros<T extends LibroPublico>(libros: readonly T[]): { at: T[]; nt: T[] } {
  const ordenados = libros.slice().sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  return {
    at: ordenados.filter((libro) => libro.testament === "ot"),
    nt: ordenados.filter((libro) => libro.testament === "nt"),
  };
}

export function ordenarRetosEstacionales<T extends { id: string; tiempo: string }>(retos: readonly T[], hoy: string): T[] {
  const lista = retos
    .filter((reto) => ESTACIONAL.has(reto.tiempo))
    .slice()
    .sort((a, b) => (INICIO[a.id] ?? "9999-99-99").localeCompare(INICIO[b.id] ?? "9999-99-99"));
  const siguiente = lista.findIndex((reto) => (FIN[reto.id] ?? INICIO[reto.id] ?? "9999-99-99") >= hoy);
  if (siguiente <= 0) return lista;
  return [...lista.slice(siguiente), ...lista.slice(0, siguiente)];
}

export function inicioDeReto(id: string): string | null {
  return INICIO[id] ?? null;
}

const MESES_ES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const MESES_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function fechaLegible(iso: string, lang: "es" | "en"): string {
  const [, mes, dia] = iso.split("-");
  const indice = Number(mes) - 1;
  const numero = Number(dia);
  if (lang === "en") return `${numero} ${MESES_EN[indice] ?? ""}`;
  return `${numero} de ${MESES_ES[indice] ?? ""}`;
}

export function etiquetaInicio(iso: string, lang: "es" | "en"): string {
  const fecha = fechaLegible(iso, lang);
  return lang === "en" ? `Starts ${fecha}` : `Empieza el ${fecha}`;
}

export function mesesAUnEpisodioAlDia(episodios: number): number {
  if (episodios <= 0) return 0;
  return Math.max(1, Math.round(episodios / 30));
}
