import audioJson from "../../../content/audio_listo.json";

export type EpisodioListo = { id: string; duracion_s: number; bytes: number };

export type AudioListo = {
  version: number;
  idioma: string;
  bucket: string;
  prefijo: string;
  formato: string;
  episodios: EpisodioListo[];
  en_revision: string[];
  bloqueados: string[];
};

export function audioListo(): AudioListo {
  return audioJson as AudioListo;
}

export function episodioListo(id: string, datos: AudioListo = audioListo()): EpisodioListo | null {
  if (!/^[\w-]+$/.test(id)) return null;
  return datos.episodios.find((episodio) => episodio.id === id) ?? null;
}

export function rutaAudio(id: string, datos: AudioListo = audioListo()): string | null {
  if (!episodioListo(id, datos)) return null;
  if (!datos.prefijo || datos.prefijo.includes("..") || datos.prefijo.startsWith("/")) return null;
  return `${datos.prefijo}/${id}.mp3`;
}
