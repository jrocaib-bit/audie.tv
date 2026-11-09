import { diaLiturgicoDeIso, referenciaPaso, type DiaLiturgico, type PasajeDia, type Reto } from "./liturgia";

export type FilaPrograma = {
  fecha: string;
  tiempo: string;
  celebracion: string;
  rango: string;
  color: string;
  ciclo: string;
  ferial: string;
  salterio: number;
  referencia: string;
  titulo: string;
  reto: string;
  estanteria: string;
};

function sumarIso(valor: string, dias: number): string {
  const fecha = new Date(`${valor}T00:00:00Z`);
  fecha.setUTCDate(fecha.getUTCDate() + dias);
  return fecha.toISOString().slice(0, 10);
}

export function retosDelDia(dia: DiaLiturgico, retos: readonly Reto[]): Reto[] {
  const tiempo = dia.tiempo === "triduo" ? "semana-santa" : dia.tiempo;
  const deTiempo = retos.filter((reto) => reto.tiempo === tiempo);
  const marianos = new Set(["maria-madre", "anunciacion", "visitacion", "asuncion", "pilar", "inmaculada"]);
  const deFiesta = retos.filter((reto) => {
    if (!dia.celebracion) return false;
    if (dia.celebracion.id === "Pentecostés" && reto.id === "pentecostes") return true;
    if (marianos.has(dia.celebracion.id) && reto.id === "maria") return true;
    return false;
  });
  const vistos = new Set<string>();
  return [...deFiesta, ...deTiempo].filter((reto) => (vistos.has(reto.id) ? false : vistos.add(reto.id)));
}

export function pasajeDelDia(dia: DiaLiturgico, retos: readonly Reto[]): { titulo: { es: string; en: string }; referencia: PasajeDia } | null {
  if (dia.celebracion) return { titulo: dia.celebracion.pasaje.titulo, referencia: dia.celebracion.pasaje };
  const reto = retosDelDia(dia, retos)[0];
  if (!reto || reto.pasos.length === 0) return null;
  const indice = (Math.max(1, dia.dia) - 1) % reto.pasos.length;
  const paso = reto.pasos[indice];
  if (!paso) return null;
  return {
    titulo: paso.titulo,
    referencia: { libroId: paso.libroId, capitulo: paso.capitulo, versiculo: paso.versiculo, versiculoFin: paso.versiculoFin, titulo: paso.titulo },
  };
}

export function programaDeDia(iso: string, retos: readonly Reto[]): FilaPrograma {
  const dia = diaLiturgicoDeIso(iso);
  const activos = retosDelDia(dia, retos);
  const pasaje = pasajeDelDia(dia, retos);
  return {
    fecha: iso,
    tiempo: dia.nombre.es,
    celebracion: dia.celebracion?.es ?? dia.etiqueta.es,
    rango: dia.rango,
    color: dia.color,
    ciclo: dia.ciclo,
    ferial: dia.ferial,
    salterio: dia.salterio,
    referencia: pasaje ? referenciaPaso(pasaje.referencia, "es", true) : "",
    titulo: pasaje?.titulo.es ?? "",
    reto: activos[0]?.titulo.es ?? "",
    estanteria: activos.map((reto) => reto.titulo.es).join(" | "),
  };
}

export function programaEntre(desde: string, hasta: string, retos: readonly Reto[]): FilaPrograma[] {
  const filas: FilaPrograma[] = [];
  for (let cursor = desde; cursor <= hasta; cursor = sumarIso(cursor, 1)) filas.push(programaDeDia(cursor, retos));
  return filas;
}

export function programaCsv(filas: readonly FilaPrograma[]): string {
  const columnas: (keyof FilaPrograma)[] = ["fecha", "tiempo", "celebracion", "rango", "color", "ciclo", "ferial", "salterio", "referencia", "titulo", "reto", "estanteria"];
  const linea = (fila: FilaPrograma) => columnas.map((columna) => `"${String(fila[columna]).replaceAll("\"", "\"\"")}"`).join(",");
  return [columnas.join(","), ...filas.map(linea)].join("\n");
}
