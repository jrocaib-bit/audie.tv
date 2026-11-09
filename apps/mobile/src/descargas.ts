import {
  CLAVE_DESCARGAS,
  parseArchivos,
  quitarArchivo,
  registrarArchivo,
  uriDeReproduccion,
  type ArchivoLocal,
} from "@audite/domain";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Directory, File, Paths } from "expo-file-system";

const carpeta = new Directory(Paths.document, "audite-audio");

export async function leerDescargas(): Promise<ArchivoLocal[]> {
  const raw = await AsyncStorage.getItem(CLAVE_DESCARGAS);
  if (!raw) return [];
  try {
    return parseArchivos(JSON.parse(raw) as unknown);
  } catch {
    return [];
  }
}

async function guardarIndice(archivos: ArchivoLocal[]): Promise<void> {
  await AsyncStorage.setItem(CLAVE_DESCARGAS, JSON.stringify({ archivos }));
}

export async function bajarEpisodio(episodeId: string, segmentos: { id: string; url: string }[]): Promise<ArchivoLocal> {
  if (!carpeta.exists) carpeta.create({ intermediates: true, idempotent: true });
  const partes: { id: string; ruta: string }[] = [];
  let bytes = 0;
  for (const segmento of segmentos) {
    const destino = new File(carpeta, `${episodeId}-${segmento.id}.mp3`);
    if (destino.exists) destino.delete();
    const archivo = await File.downloadFileAsync(segmento.url, destino);
    bytes += archivo.size ?? 0;
    partes.push({ id: segmento.id, ruta: archivo.uri });
  }
  const siguiente = registrarArchivo(await leerDescargas(), {
    episodeId,
    bytes,
    ruta: partes[0]?.ruta ?? "",
    actualizadoEn: new Date().toISOString(),
    segmentos: partes,
  });
  await guardarIndice(siguiente);
  return siguiente.find((item) => item.episodeId === episodeId)!;
}

export async function borrarEpisodio(episodeId: string): Promise<ArchivoLocal[]> {
  const actual = await leerDescargas();
  const encontrado = actual.find((item) => item.episodeId === episodeId);
  if (encontrado) {
    const archivo = new File(encontrado.ruta);
    if (archivo.exists) archivo.delete();
  }
  const siguiente = quitarArchivo(actual, episodeId);
  await guardarIndice(siguiente);
  return siguiente;
}

export function fuenteDeSegmento(episodeId: string, remoto: string, archivos: readonly ArchivoLocal[]): string {
  return uriDeReproduccion(episodeId, remoto, archivos).uri;
}
