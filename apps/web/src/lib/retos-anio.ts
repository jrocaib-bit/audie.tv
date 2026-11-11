import { adviento1, bautismoDelSenor, miercolesCeniza, pascua, pentecostes } from "@audite/domain";
import { obraDeEpisodio } from "@audite/content/obras";
import { portadaDeReto } from "@audite/content/obras-creditos";
import { RETOS_ANIO, type RetoAnioDato } from "./retos-anio-datos";

export type { RetoAnioDato };
export { RETOS_ANIO };

const LIBROS: Record<string, string> = { Is: "is", Lc: "lc", Mt: "mt", Jn: "jn", Ex: "ex", Mc: "mc", Hch: "hch" };
const CICLO = 2026;

export type RangoEpisodio = { id: string; bookId: string; rango: string };
export type Cita = { libro: string; capitulo: number; versiculo: number; versiculoFin: number };

export function retosDeTemporada(): RetoAnioDato[] {
  return RETOS_ANIO;
}

export function retoDeTemporada(id: string): RetoAnioDato | null {
  return RETOS_ANIO.find((reto) => reto.id === id || reto.slug.es === id || reto.slug.en === id) ?? null;
}

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

export function portadasDeTemporada(rangos: readonly RangoEpisodio[]): Record<string, PortadaTemporada | null> {
  const usadas = new Set<string>();
  const salida: Record<string, PortadaTemporada | null> = {};
  for (const reto of RETOS_ANIO) {
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
