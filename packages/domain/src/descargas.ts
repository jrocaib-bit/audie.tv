export type Red = "wifi" | "celular" | "desconocida" | "sin-red";
export type AlcanceDescarga = "episodio" | "libro" | "semana";
export type MotivoRed = "listo" | "solo-wifi" | "sin-red";

export type EpisodioDescargable = {
  id: string;
  bookId: string;
  titulo: string;
  bytes: number;
  remoto: string;
};

export type ArchivoLocal = {
  episodeId: string;
  bytes: number;
  ruta: string;
  actualizadoEn: string;
  segmentos?: { id: string; ruta: string }[];
};

export type PreferenciaDescarga = {
  soloWifi: boolean;
};

export const CLAVE_DESCARGAS = "audite.descargas.v1";
export const CLAVE_DESCARGA_PREFERENCIA = "audite.descargas.preferencia.v1";

export function parseArchivos(value: unknown): ArchivoLocal[] {
  if (!value || typeof value !== "object") return [];
  const lista = (value as { archivos?: unknown }).archivos;
  if (!Array.isArray(lista)) return [];
  return lista.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const archivo = item as Partial<ArchivoLocal>;
    if (typeof archivo.episodeId !== "string" || typeof archivo.ruta !== "string") return [];
    const bytes = typeof archivo.bytes === "number" && Number.isFinite(archivo.bytes) ? Math.max(0, archivo.bytes) : 0;
    const segmentos = Array.isArray(archivo.segmentos)
      ? archivo.segmentos.flatMap((segmento) => {
          if (!segmento || typeof segmento !== "object") return [];
          const item = segmento as { id?: unknown; ruta?: unknown };
          if (typeof item.id !== "string" || typeof item.ruta !== "string") return [];
          return [{ id: item.id, ruta: item.ruta }];
        })
      : undefined;
    return [{
      episodeId: archivo.episodeId,
      bytes,
      ruta: archivo.ruta,
      actualizadoEn: typeof archivo.actualizadoEn === "string" ? archivo.actualizadoEn : "",
      segmentos,
    }];
  });
}

export function parsePreferencia(value: unknown): PreferenciaDescarga {
  if (!value || typeof value !== "object") return { soloWifi: true };
  return { soloWifi: (value as { soloWifi?: unknown }).soloWifi !== false };
}

export function puedeBajar(soloWifi: boolean, red: Red): MotivoRed {
  if (red === "sin-red") return "sin-red";
  if (soloWifi && red !== "wifi") return "solo-wifi";
  return "listo";
}

export function idsDeAlcance(
  alcance: AlcanceDescarga,
  episodios: readonly EpisodioDescargable[],
  objetivo: { episodioId?: string; bookId?: string; camino: readonly string[]; oidos: ReadonlySet<string> },
): string[] {
  if (alcance === "episodio") {
    return objetivo.episodioId && episodios.some((episodio) => episodio.id === objetivo.episodioId) ? [objetivo.episodioId] : [];
  }
  if (alcance === "libro") {
    return episodios.filter((episodio) => episodio.bookId === objetivo.bookId).map((episodio) => episodio.id);
  }
  const pendientes = objetivo.camino.filter((id) => episodios.some((episodio) => episodio.id === id) && !objetivo.oidos.has(id));
  return pendientes.slice(0, 7);
}

export function planificar(ids: readonly string[], archivos: readonly ArchivoLocal[]): { nuevos: string[]; ya: string[] } {
  const guardados = new Set(archivos.map((archivo) => archivo.episodeId));
  return {
    nuevos: ids.filter((id) => !guardados.has(id)),
    ya: ids.filter((id) => guardados.has(id)),
  };
}

export function espacioUsado(archivos: readonly ArchivoLocal[]): number {
  return archivos.reduce((suma, archivo) => suma + Math.max(0, archivo.bytes), 0);
}

export function quitarArchivo(archivos: readonly ArchivoLocal[], episodeId: string): ArchivoLocal[] {
  return archivos.filter((archivo) => archivo.episodeId !== episodeId);
}

export function registrarArchivo(archivos: readonly ArchivoLocal[], archivo: ArchivoLocal): ArchivoLocal[] {
  return [...archivos.filter((item) => item.episodeId !== archivo.episodeId), archivo];
}

export function uriDeReproduccion(
  episodeId: string,
  remoto: string,
  archivos: readonly ArchivoLocal[],
): { origen: "local" | "red"; uri: string } {
  const local = archivos.find((archivo) => archivo.episodeId === episodeId && archivo.ruta.length > 0);
  if (local) return { origen: "local", uri: local.ruta };
  return { origen: "red", uri: remoto };
}

export function urisDeReproduccion(
  episodeId: string,
  segmentos: readonly { id: string; remoto: string }[],
  archivos: readonly ArchivoLocal[],
): { origen: "local" | "red"; uris: string[] } {
  const local = archivos.find((archivo) => archivo.episodeId === episodeId);
  if (!local) return { origen: "red", uris: segmentos.map((segmento) => segmento.remoto) };
  if (local.segmentos && local.segmentos.length > 0) {
    return {
      origen: "local",
      uris: segmentos.map((segmento) => local.segmentos?.find((item) => item.id === segmento.id)?.ruta ?? segmento.remoto),
    };
  }
  return { origen: "local", uris: [local.ruta] };
}

export function textoEspacio(bytes: number, locale: "es" | "en"): string {
  const formato = new Intl.NumberFormat(locale === "en" ? "en-US" : "es-ES", { maximumFractionDigits: 1 });
  if (bytes < 1024 * 1024) return `${formato.format(bytes / 1024)} KB`;
  return `${formato.format(bytes / (1024 * 1024))} MB`;
}
