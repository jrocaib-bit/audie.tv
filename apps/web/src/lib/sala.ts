import { adviento1, bautismoDelSenor, miercolesCeniza, pascua, pentecostes } from "@audite/domain";
import { esPortadaProvisional, obraDeEpisodio, obraWebp } from "@audite/content/obras";
import { portadaDeReto } from "@audite/content/obras-creditos";
import { etiquetaInicio } from "@/lib/publico";
import { episodioDeCita, inicioDeTemporada, portadaConectada, type RangoEpisodio, type RetoAnioDato } from "@/lib/retos-anio";

export type PortadaSala = { src: string; obraId: string; oficial: boolean; ancho?: string };

function esPortadaDeCatalogo(episodio: string): boolean {
  return episodio === "sal-001" || /-01$/.test(episodio);
}

/**
 * Una portada por reto sin repetir obra entre ellos ni con las que ya están en pantalla (`evitar`).
 * Una portada conectada (apaisada) nunca es oficial vertical: se enmarca entera con Lienzo.
 * Portada oficial si existe; si no, la primera pintura libre del recorrido. Sin portada: null.
 */
export function portadasSinRepetir(retos: readonly RetoAnioDato[], rangos: readonly RangoEpisodio[], evitar: Iterable<string> = []): Map<string, PortadaSala | null> {
  const usadas = new Set(evitar);
  const salida = new Map<string, PortadaSala | null>();
  for (const reto of retos) {
    const conectada = portadaConectada(reto);
    if (conectada) {
      salida.set(reto.id, { src: conectada, obraId: `reto-${reto.id}`, oficial: false });
      continue;
    }
    if (reto.sinCuadro) {
      salida.set(reto.id, null);
      continue;
    }
    const propia = portadaDeReto(reto.id);
    if (propia && !usadas.has(propia.id)) {
      usadas.add(propia.id);
      salida.set(reto.id, { src: propia.src.vertical, ancho: propia.src.ancho, obraId: propia.id, oficial: true });
      continue;
    }
    const candidatos = reto.dias.flatMap((dia) => {
      const episodio = episodioDeCita(dia.cita, rangos);
      const obra = episodio ? obraDeEpisodio(episodio) : null;
      return episodio && obra && !esPortadaProvisional(episodio) && !usadas.has(obra.id) ? [{ episodio, obra }] : [];
    });
    const elegido = candidatos.find((item) => !esPortadaDeCatalogo(item.episodio)) ?? candidatos[0] ?? null;
    if (elegido) usadas.add(elegido.obra.id);
    salida.set(reto.id, elegido ? { src: obraWebp(elegido.obra), obraId: elegido.obra.id, oficial: false } : null);
  }
  return salida;
}

export function hoyMadrid(ahora = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit" }).format(ahora);
}

function dias(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Math.round(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1) / 86_400_000);
}

export function sumar(iso: string, n: number): string {
  return new Date((dias(iso) + n) * 86_400_000).toISOString().slice(0, 10);
}

export type EstadoReto = "en-curso" | "proximo" | "terminado" | "libre";

export function estadoDeReto(reto: RetoAnioDato, hoy: string): { estado: EstadoReto; hechos: number; faltan: number } {
  const inicio = reto.fijo ? inicioDeTemporada(reto.id) : null;
  if (!inicio) return { estado: "libre", hechos: 0, faltan: 0 };
  const total = reto.dias.length;
  const paso = dias(hoy) - dias(inicio);
  if (paso < 0) return { estado: "proximo", hechos: 0, faltan: -paso };
  if (paso >= total) return { estado: "terminado", hechos: total, faltan: 0 };
  return { estado: "en-curso", hechos: paso, faltan: 0 };
}

/** El reto en curso o, si no hay, el siguiente que empieza. */
export function retoHeroe(retos: readonly RetoAnioDato[], hoy: string): RetoAnioDato | null {
  const fijos = retos.filter((reto) => reto.fijo && inicioDeTemporada(reto.id)).sort((a, b) => dias(inicioDeTemporada(a.id)!) - dias(inicioDeTemporada(b.id)!));
  return fijos.find((reto) => estadoDeReto(reto, hoy).estado === "en-curso") ?? fijos.find((reto) => estadoDeReto(reto, hoy).estado === "proximo") ?? fijos[0] ?? null;
}

export type TramoLiturgico = { id: string; es: string; en: string; inicio: string; fin: string };

/** Año litúrgico desde el Adviento del ciclo hasta el Ordinario tras Pentecostés. */
export function anioLiturgico(ciclo = 2026): TramoLiturgico[] {
  const adviento = adviento1(ciclo);
  const navidad = `${ciclo}-12-25`;
  const ordinario1 = sumar(bautismoDelSenor(ciclo + 1), 1);
  const ceniza = miercolesCeniza(ciclo + 1);
  const pascuaDia = pascua(ciclo + 1);
  const semanaSanta = sumar(pascuaDia, -7);
  const pentecostesDia = pentecostes(ciclo + 1);
  const finOrdinario = sumar(pentecostesDia, 35);
  return [
    { id: "adviento", es: "Adviento", en: "Advent", inicio: adviento, fin: sumar(navidad, -1) },
    { id: "navidad", es: "Navidad", en: "Christmas", inicio: navidad, fin: sumar(ordinario1, -1) },
    { id: "ordinario-1", es: "Ordinario", en: "Ordinary", inicio: ordinario1, fin: sumar(ceniza, -1) },
    { id: "cuaresma", es: "Cuaresma", en: "Lent", inicio: ceniza, fin: sumar(semanaSanta, -1) },
    { id: "semana-santa", es: "Semana Santa", en: "Holy Week", inicio: semanaSanta, fin: sumar(pascuaDia, -1) },
    { id: "pascua", es: "Pascua", en: "Easter", inicio: pascuaDia, fin: pentecostesDia },
    { id: "ordinario-2", es: "Ordinario", en: "Ordinary", inicio: sumar(pentecostesDia, 1), fin: finOrdinario },
  ];
}

export function posicionHoy(tramos: readonly TramoLiturgico[], hoy: string): number {
  const inicio = dias(tramos[0]!.inicio);
  const fin = dias(tramos.at(-1)!.fin);
  return Math.min(1, Math.max(0, (dias(hoy) - inicio) / Math.max(1, fin - inicio)));
}

export function duracionTramo(tramo: TramoLiturgico): number {
  return Math.max(1, dias(tramo.fin) - dias(tramo.inicio) + 1);
}

export function chipDeReto(reto: RetoAnioDato, hoy: string, ui: "es" | "en"): string {
  const { estado } = estadoDeReto(reto, hoy);
  const inicio = inicioDeTemporada(reto.id);
  if (estado === "en-curso") return ui === "en" ? "In progress" : "En curso";
  if (estado === "terminado") return ui === "en" ? "Finished" : "Terminado";
  if (estado === "proximo" && inicio) return etiquetaInicio(inicio, ui);
  return ui === "en" ? "Any time" : "Cuando quieras";
}
