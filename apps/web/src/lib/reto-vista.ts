import { audioListo } from "@audite/content/audio-listo";
import { esPortadaProvisional, obraDeEpisodio, obraWebp } from "@audite/content/obras";
import { fechaLegible } from "@/lib/publico";
import { episodioDeCita, fechaDeDia, portadasDeTemporada, type RangoEpisodio, type RetoAnioDato } from "@/lib/retos-anio";

export type DiaVista = {
  numero: number;
  titulo: string;
  cita: string;
  fecha: string | null;
  cuando: string | null;
  episodio: string | null;
  src: string | null;
  audio: boolean;
  hoy: boolean;
};

export type ModeloReto = {
  id: string;
  titulo: string;
  portada: string | null;
  dias: DiaVista[];
  empezar: string | null;
};

export function hoyEnMadrid(cuando = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit" }).format(cuando);
}

export function episodioParaEmpezar(dias: readonly Pick<DiaVista, "episodio" | "audio" | "hoy">[]): string | null {
  const deHoy = dias.find((dia) => dia.hoy && dia.audio && dia.episodio);
  if (deHoy?.episodio) return deHoy.episodio;
  return dias.find((dia) => dia.audio && dia.episodio)?.episodio ?? null;
}

export function modeloDeReto(reto: RetoAnioDato, rangos: readonly RangoEpisodio[], lang: "es" | "en", hoy = hoyEnMadrid(), listos: ReadonlySet<string> = new Set(audioListo().episodios.map((episodio) => episodio.id))): ModeloReto {
  const portada = portadasDeTemporada(rangos)[reto.id];
  const usadas = new Set<string>();
  let imagen: string | null = null;
  if (portada?.tipo === "reto") imagen = portada.src;
  if (portada?.tipo === "episodio") {
    usadas.add(portada.obraId);
    const obra = obraDeEpisodio(portada.episodio);
    imagen = obra && !esPortadaProvisional(portada.episodio) ? obraWebp(obra) : null;
  }
  const dias = reto.dias.map((dia, indice): DiaVista => {
    const episodio = episodioDeCita(dia.cita, rangos);
    const fecha = fechaDeDia(reto.id, indice);
    const obra = episodio ? obraDeEpisodio(episodio) : null;
    const libre = Boolean(obra && episodio && !esPortadaProvisional(episodio) && !usadas.has(obra.id));
    if (obra && libre) usadas.add(obra.id);
    return {
      numero: indice + 1,
      titulo: dia[lang],
      cita: dia.cita,
      fecha,
      cuando: fecha ? fechaLegible(fecha, lang) : null,
      episodio,
      src: libre && obra ? obraWebp(obra) : null,
      audio: Boolean(episodio && listos.has(episodio)),
      hoy: Boolean(fecha && fecha === hoy),
    };
  });
  return {
    id: reto.id,
    titulo: reto.titulo[lang],
    portada: imagen,
    dias,
    empezar: episodioParaEmpezar(dias),
  };
}
