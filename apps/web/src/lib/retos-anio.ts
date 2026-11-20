import { adviento1, bautismoDelSenor, miercolesCeniza, pascua, pentecostes } from "@audite/domain";
import { esPortadaProvisional, obraDeEpisodio } from "@audite/content/obras";
import { portadaDeReto } from "@audite/content/obras-creditos";
import profeciasJson from "../../../../content/tiempos/profecias-pasion.json";
import { RETOS_ANIO, type DiaAnio, type RetoAnioDato } from "./retos-anio-datos";

export type { DiaAnio, RetoAnioDato };
export { RETOS_ANIO };

const LIBROS: Record<string, string> = { Is: "is", Lc: "lc", Mt: "mt", Jn: "jn", Ex: "ex", Mc: "mc", Hch: "hch" };
const CICLO = 2026;

export type RangoEpisodio = { id: string; bookId: string; rango: string };
export type Cita = { libro: string; capitulo: number; versiculo: number; versiculoFin: number };

type ParProfecia = { profecia: string; cumplimiento: string };

type DiaProfecia = {
  id: string;
  dia: number;
  fecha: string;
  titulo: { es: string; en: string };
  dia_liturgico?: { es: string; en: string };
  profecias?: ParProfecia[];
  profecia?: string;
  cumplimiento?: string;
  nota: { es: string; en: string };
  episodios_relacionados: string[];
  duracion_estimada_s: number;
};

function paresDeDia(dia: DiaProfecia): ParProfecia[] {
  if (dia.profecias && dia.profecias.length > 0) return dia.profecias;
  if (dia.profecia && dia.cumplimiento) return [{ profecia: dia.profecia, cumplimiento: dia.cumplimiento }];
  return [];
}

function retoProfecias(): RetoAnioDato {
  const archivo = profeciasJson as Omit<RetoAnioDato, "dias"> & { dias: DiaProfecia[] };
  const dias: DiaAnio[] = archivo.dias.map((dia) => {
    const pares = paresDeDia(dia);
    const primero = pares[0];
    return {
      es: dia.titulo.es,
      en: dia.titulo.en,
      cita: pares.map((par) => `${par.profecia} → ${par.cumplimiento}`).join(" · "),
      profecia: primero?.profecia,
      cumplimiento: primero?.cumplimiento,
      profecias: pares,
      diaLiturgico: dia.dia_liturgico,
      nota: dia.nota,
      relacionados: dia.episodios_relacionados,
      pieza: dia.id,
      fecha: dia.fecha,
      duracion_s: dia.duracion_estimada_s,
    };
  });
  return { ...archivo, dias };
}

/** Los retos del año, con Profecías dentro de Semana Santa. */
export function retosDeTemporada(): RetoAnioDato[] {
  const lista = [...RETOS_ANIO];
  const hueco = lista.findIndex((reto) => reto.id === "semana-santa-pasion");
  lista.splice(hueco < 0 ? lista.length : hueco + 1, 0, retoProfecias());
  return lista;
}

export function retoDeTemporada(id: string): RetoAnioDato | null {
  return retosDeTemporada().find((reto) => reto.id === id || reto.slug.es === id || reto.slug.en === id) ?? null;
}

/** Imagen futura del reto. Vacío: la página reserva el hueco de marca. */
export function portadaConectada(reto: RetoAnioDato, env = process.env.NEXT_PUBLIC_RETO_PROFECIAS_PORTADA): string {
  const propia = (reto.portada ?? "").trim();
  if (reto.id !== "profecias-pasion") return propia;
  return (env ?? propia).trim();
}

/** Base de miniaturas del reto, solo si el entorno la define (p. ej. Preview). */
export function baseMiniaturasProfecias(env = process.env.NEXT_PUBLIC_RETO_PROFECIAS_MINIATURAS_BASE): string {
  return (env ?? "").trim().replace(/\/+$/, "");
}

export function miniaturaDePieza(pieza: string | undefined, env = process.env.NEXT_PUBLIC_RETO_PROFECIAS_MINIATURAS_BASE): string {
  const base = baseMiniaturasProfecias(env);
  if (!base || !pieza) return "";
  return `${base}/${pieza}_es_miniatura_v1.webp`;
}

export const CREDITO_PORTADA_PROFECIAS = {
  es: "El cordero sacrificial · Josefa de Ayala (Josefa de Óbidos) · c. 1670–1684 · Walters Art Museum, Baltimore",
  en: "The Sacrificial Lamb · Josefa de Ayala (Josefa de Óbidos) · c. 1670–1684 · Walters Art Museum, Baltimore",
} as const;

export const CREDITOS_DIAS_PROFECIAS: Record<string, { es: string; en: string }> = {
  "pp-01": {
    es: "La entrada en Jerusalén · T'oros Roslin · 1262 · Walters Art Museum, Baltimore",
    en: "Entry into Jerusalem · T'oros Roslin · 1262 · Walters Art Museum, Baltimore",
  },
  "pp-02": {
    es: "Judas recibe las treinta monedas de plata · Augustin Hirschvogel · 1547 · The Metropolitan Museum of Art, Nueva York",
    en: "Judas Being Paid the 30 Pieces of Silver · Augustin Hirschvogel · 1547 · The Metropolitan Museum of Art, New York",
  },
  "pp-03": {
    es: "La Última Cena · Círculo del Maestro de la Muerte de la Virgen de Ámsterdam · c. 1485–1500 · Rijksmuseum, Ámsterdam",
    en: "The Last Supper · Circle of the Master of the Amsterdam Death of the Virgin · c. 1485–1500 · Rijksmuseum, Amsterdam",
  },
  "pp-04": {
    es: "El beso de Judas · Maestro del Primer Libro de Oraciones de Maximiliano · c. 1500 · Cleveland Museum of Art",
    en: "The Kiss of Judas · Master of the First Prayer Book of Maximilian · c. 1500 · Cleveland Museum of Art",
  },
  "pp-05": {
    es: "Cristo ante Pilato · Mihály Munkácsy · 1881 · Déri Múzeum, Debrecen",
    en: "Christ before Pilate · Mihály Munkácsy · 1881 · Déri Museum, Debrecen",
  },
  "pp-06": {
    es: "Cristo en la cruz · Eugène Delacroix · 1846 · Walters Art Museum, Baltimore",
    en: "Christ on the Cross · Eugène Delacroix · 1846 · Walters Art Museum, Baltimore",
  },
  "pp-07": {
    es: "Placa con la Crucifixión · Anónimo alemán (Westfalia) · c. 1200 · The Metropolitan Museum of Art, Nueva York",
    en: "Plaque with the Crucifixion · Anonymous German (Westphalia) · c. 1200 · The Metropolitan Museum of Art, New York",
  },
  "pp-08": {
    es: "Descenso a los infiernos (Anástasis) · Anónimo bizantino · principios del siglo XV · The Metropolitan Museum of Art, Nueva York",
    en: "The Descent into Hell (Anastasis) · Anonymous Byzantine · early 15th century · The Metropolitan Museum of Art, New York",
  },
};

export function parsearCita(cita: string): Cita | null {
  const limpia = cita.replace(/[–—]/g, "-").trim();
  const match = limpia.match(/^([A-Za-z]+)\s+(\d+),(\d+)(?:-(\d+))?$/);
  if (!match) return null;
  const libro = LIBROS[match[1] ?? ""];
  if (!libro) return null;
  const versiculo = Number(match[3]);
  return { libro, capitulo: Number(match[2]), versiculo, versiculoFin: Number(match[4] ?? versiculo) };
}

export function episodioDeCita(cita: string, rangos: readonly RangoEpisodio[]): string | null {
  const punto = parsearCita(cita);
  if (!punto) return null;
  const marca = punto.capitulo * 1000 + punto.versiculo;
  for (const rango of rangos) {
    if (rango.bookId !== punto.libro) continue;
    const trozo = rango.rango.match(/^(\d+):(\d+)-(\d+):(\d+)$/);
    if (!trozo) continue;
    const inicio = Number(trozo[1]) * 1000 + Number(trozo[2]);
    const fin = Number(trozo[3]) * 1000 + Number(trozo[4]);
    if (marca >= inicio && marca <= fin) return rango.id;
  }
  return null;
}

function sumarIso(isoFecha: string, dias: number): string {
  const [anio, mes, dia] = isoFecha.split("-").map(Number);
  const fecha = new Date(Date.UTC(anio ?? 1970, (mes ?? 1) - 1, dia ?? 1));
  fecha.setUTCDate(fecha.getUTCDate() + dias);
  return fecha.toISOString().slice(0, 10);
}

export function inicioDeTemporada(id: string, ciclo = CICLO): string | null {
  const reto = retoDeTemporada(id);
  if (!reto) return null;
  if (reto.id === "adviento-isaias") return adviento1(ciclo);
  if (reto.id === "navidad-infancia") return `${ciclo}-12-25`;
  if (reto.id === "cuaresma-40") return miercolesCeniza(ciclo + 1);
  if (reto.id === "profecias-pasion") return sumarIso(pascua(ciclo + 1), -7);
  if (reto.id === "semana-santa-pasion") return sumarIso(pascua(ciclo + 1), -7);
  if (reto.id === "pascua-hechos") return pascua(ciclo + 1);
  if (reto.id === "ordinario-evangelio") return sumarIso(bautismoDelSenor(ciclo + 1), 1);
  return null;
}

export function finDePascua(ciclo = CICLO): string {
  return pentecostes(ciclo + 1);
}

export function fechaDeDia(id: string, indice: number, ciclo = CICLO): string | null {
  const reto = retoDeTemporada(id);
  if (!reto?.fijo) return null;
  const inicio = inicioDeTemporada(id, ciclo);
  if (!inicio) return null;
  return sumarIso(inicio, indice);
}

export type PortadaTemporada =
  | { tipo: "reto"; src: string; obraId: string }
  | { tipo: "episodio"; episodio: string; obraId: string };

function esPortadaDeCatalogo(episodio: string): boolean {
  return episodio === "sal-001" || /-01$/.test(episodio);
}

/** Primer episodio del recorrido cuya obra no está ya en pantalla. */
export function episodioConObraLibre(candidatos: readonly string[], evitar: ReadonlySet<string>): string | null {
  for (const id of candidatos) {
    const obra = obraDeEpisodio(id);
    if (obra && !esPortadaProvisional(id) && !evitar.has(obra.id)) return id;
  }
  return null;
}

export function idsDePrueba(rangos: readonly RangoEpisodio[], listos: ReadonlySet<string>): string[] {
  const adviento = RETOS_ANIO.find((reto) => reto.id === "adviento-isaias");
  const ids = ["gn-01"];
  for (const dia of adviento?.dias ?? []) {
    const episodio = episodioDeCita(dia.cita, rangos);
    if (episodio?.startsWith("is-") && listos.has(episodio) && !ids.includes(episodio)) ids.push(episodio);
  }
  return ids.filter((id) => listos.has(id));
}

export function portadasDeTemporada(rangos: readonly RangoEpisodio[]): Record<string, PortadaTemporada | null> {
  const usadas = new Set<string>();
  const salida: Record<string, PortadaTemporada | null> = {};
  for (const reto of retosDeTemporada()) {
    if (reto.sinCuadro) {
      salida[reto.id] = null;
      continue;
    }
    const propia = portadaDeReto(reto.id);
    if (propia) {
      usadas.add(propia.id);
      salida[reto.id] = { tipo: "reto", src: propia.src.ancho, obraId: propia.id };
      continue;
    }
    const candidatos = reto.dias.flatMap((dia) => {
      const episodio = episodioDeCita(dia.cita, rangos);
      const obra = episodio ? obraDeEpisodio(episodio) : null;
      return episodio && obra ? [{ episodio, obraId: obra.id }] : [];
    });
    const alternativas = candidatos.filter((item) => !esPortadaDeCatalogo(item.episodio) && !usadas.has(item.obraId));
    const lista = alternativas.length > 0 ? alternativas : candidatos.filter((item) => !usadas.has(item.obraId));
    const elegido = lista[0] ?? null;
    if (elegido) usadas.add(elegido.obraId);
    salida[reto.id] = elegido ? { tipo: "episodio", episodio: elegido.episodio, obraId: elegido.obraId } : null;
  }
  return salida;
}
