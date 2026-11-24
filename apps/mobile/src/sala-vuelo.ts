/**
 * Vuelo EN VIVO de «La sala» (v3): Google Photorealistic 3D Tiles (Map Tiles API) + CesiumJS en una WebView.
 *
 * Este módulo es solo datos y funciones puras (sin React Native): coordenadas y keyframes de cámara por sede.
 * El HTML del vuelo vive en sala-vuelo-html.ts y NO lleva clave; la clave se inyecta en memoria en tiempo de
 * ejecución (ver scriptInyeccionVuelo) desde EXPO_PUBLIC_GOOGLE_MAPS_API_KEY.
 *
 * Políticas de Map Tiles API que se respetan:
 * - Nada de cachear, precargar ni pre-renderizar teselas: se cargan en vivo desde Google.
 * - El logo de Google y las atribuciones de datos van en pantalla durante todo el vuelo (showCreditsOnScreen).
 * - Una sesión por apertura de root.json; Cesium la reutiliza mientras no se recargue el tileset.
 */
import { SEDES_COORDENADAS } from "./sala-lugares";
import type { SedeId } from "./sala-espacios";

/** Un punto de la trayectoria. El vuelo desciende por rango logarítmico (como Google Earth). */
export type KeyframeVuelo = {
  /** Distancia de la cámara al objetivo, en metros. Estrictamente decreciente a lo largo de la lista. */
  rango: number;
  /** Objetivo al que mira la cámara (grados). */
  lon: number;
  lat: number;
  /** Altura del objetivo sobre el suelo (m), p. ej. la cúpula de un edificio. */
  altura: number;
  /** Rumbo de la cámara en grados (0 = norte, 90 = este). Se interpola sin envolver: dar valores continuos. */
  rumbo: number;
  /** Cabeceo en grados: -90 = cenital, 0 = horizontal. */
  cabeceo: number;
};

export type VueloSede = {
  id: SedeId;
  lat: number;
  lon: number;
  /** Altura elipsoidal aproximada del suelo (m) mientras la malla no permite medirla. */
  suelo: number;
  keyframes: KeyframeVuelo[];
};

export type PlanVuelo = {
  sede: SedeId;
  /** Duración del vuelo en ms. */
  duracion: number;
  /** Si es true, la página no arranca sola: la gobierna window.__vuelo (captura de revisión). */
  captura?: boolean;
  /** Solo depuración de la cámara sin teselas (nunca en la app). */
  depuracion?: boolean;
  /** Escala de resolución de render (1 = nativa). Solo captura. */
  escala?: number;
  /** Margen inferior (px) para no tapar logo ni atribuciones con la interfaz nativa. */
  margenInferior: number;
  suelo: number;
  keyframes: KeyframeVuelo[];
};

/** Duración del vuelo en vivo (ms): espacio -> continente -> ciudad -> edificio. */
export const DURACION_VUELO_MS = 5500;

export type CamaraSede = {
  /** Rumbo final con el que se ve la fachada (grados). */
  rumbo: number;
  /** Altura del objetivo final sobre el suelo (m). */
  altura: number;
  /** Rango final desde el que se ve el edificio (m). */
  rangoFinal: number;
  cabeceoFinal: number;
  /** Altura elipsoidal aproximada del suelo (m). */
  suelo: number;
};

const CAMARA_GENERICA: CamaraSede = { rumbo: 20, altura: 20, rangoFinal: 330, cabeceoFinal: -24, suelo: 0 };

/**
 * Ajustes finos por sede. Solo Bonnefanten está pulido; el resto usa la cámara genérica hasta que se afine.
 * El suelo es ellipsoidal (geoide + altitud): en los Países Bajos el geoide está unos 46 m por encima del elipsoide.
 */
export const CAMARAS_SEDE: Partial<Record<SedeId, CamaraSede>> = {
  bonnefanten: { rumbo: 235, altura: 25, rangoFinal: 270, cabeceoFinal: -20, suelo: 100 },
  rijksmuseum: { rumbo: 200, altura: 15, rangoFinal: 300, cabeceoFinal: -24, suelo: 44 },
  met: { rumbo: 270, altura: 15, rangoFinal: 320, cabeceoFinal: -24, suelo: -8 },
};

/** Keyframes genéricos: espacio -> continente -> ciudad -> vista aérea -> edificio. */
export function keyframesGenericos(lat: number, lon: number, cam: CamaraSede = CAMARA_GENERICA): KeyframeVuelo[] {
  return [
    { rango: 11_000_000, lon: lon - 26, lat: lat * 0.6, altura: 0, rumbo: 0, cabeceo: -88 },
    { rango: 1_200_000, lon: lon - 1.5, lat: lat - 1.0, altura: 0, rumbo: -10, cabeceo: -72 },
    { rango: 18_000, lon, lat, altura: 0, rumbo: -36, cabeceo: -56 },
    { rango: Math.round(cam.rangoFinal * 2.5), lon, lat, altura: cam.altura, rumbo: cam.rumbo - 65, cabeceo: -40 },
    { rango: cam.rangoFinal, lon, lat, altura: cam.altura, rumbo: cam.rumbo, cabeceo: cam.cabeceoFinal },
  ];
}

export function vueloDeSede(id: SedeId): VueloSede | null {
  const s = SEDES_COORDENADAS[id];
  if (!s || s.lat == null || s.lon == null) return null;
  const cam = CAMARAS_SEDE[id] ?? CAMARA_GENERICA;
  return { id, lat: s.lat, lon: s.lon, suelo: cam.suelo, keyframes: keyframesGenericos(s.lat, s.lon, cam) };
}

export function planDeVuelo(id: SedeId, opciones: { captura?: boolean; margenInferior?: number } = {}): PlanVuelo | null {
  const v = vueloDeSede(id);
  if (!v) return null;
  return {
    sede: id,
    duracion: DURACION_VUELO_MS,
    captura: opciones.captura,
    margenInferior: opciones.margenInferior ?? 0,
    suelo: v.suelo,
    keyframes: v.keyframes,
  };
}

/** Clave de Map Tiles API de la build. Vacía si no se ha configurado (entonces se usa el fallback v2). */
export function claveMapTiles(env: Record<string, string | undefined> = process.env): string {
  const k = env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  return typeof k === "string" ? k.trim() : "";
}

/** Interruptor de la build: `EXPO_PUBLIC_SALA_VUELO_VIVO` en 0, false u off apaga el vuelo en vivo. */
export function vueloEnVivoHabilitado(env: Record<string, string | undefined> = process.env): boolean {
  const v = env.EXPO_PUBLIC_SALA_VUELO_VIVO;
  if (typeof v !== "string") return true;
  return !["0", "false", "off"].includes(v.trim().toLowerCase());
}

/**
 * JavaScript que se inyecta en la página ANTES de que cargue, solo en memoria (no se escribe en disco
 * ni se registra). La clave nunca forma parte del HTML empaquetado.
 */
export function scriptInyeccionVuelo(clave: string, plan: PlanVuelo): string {
  return `window.__AUDITE_CLAVE=${JSON.stringify(clave)};window.__AUDITE_PLAN=${JSON.stringify(plan)};true;`;
}

/** Quita cualquier rastro de clave de un texto (mensajes de error, URLs) antes de registrarlo. */
export function sinClave(texto: string): string {
  return texto.replace(/([?&]key=)[^&\s"']*/gi, "$1REDACTED");
}

/**
 * Sedes con vuelo en vivo activo. Solo las pulidas y verificadas; el resto de sedes (que ya tienen coordenadas
 * y keyframes genéricos arriba) siguen con el viaje v2 hasta que se afine su cámara.
 */
export const SEDES_VUELO_VIVO: SedeId[] = ["bonnefanten"];

/** Tiempo máximo (ms) para que la WebView avise «listo» (Cesium + root.json); si no, se cae al viaje v2. */
export const ESPERA_LISTO_VUELO_MS = 9000;

/** Tiempos (ms) de la entrada con vuelo en vivo; mismos campos que tiemposViaje (ui/EntradaSalaViaje). */
export function tiemposVueloVivo() {
  return {
    video: 0,
    finalIn: 300,
    edificioIn: DURACION_VUELO_MS,
    edificioOut: DURACION_VUELO_MS,
    salaIn: DURACION_VUELO_MS - 150,
    total: DURACION_VUELO_MS + 1600,
  };
}

/**
 * «vivo»: vuelo 3D en directo. «v2»: entrada actual con vídeo y fotos (sin clave, sin red, sin soporte de WebView,
 * «reducir movimiento», sede sin vuelo activo o fallo de la WebView/root.json).
 */
export function decidirVuelo(o: {
  clave: string;
  reducir: boolean;
  sede: SedeId | null;
  soportado?: boolean;
  fallido?: boolean;
  habilitado?: boolean;
}): "vivo" | "v2" {
  if (!(o.habilitado ?? vueloEnVivoHabilitado())) return "v2";
  if (!o.clave || o.reducir || o.fallido || o.soportado === false || !o.sede) return "v2";
  if (!SEDES_VUELO_VIVO.includes(o.sede)) return "v2";
  return vueloDeSede(o.sede) ? "vivo" : "v2";
}

export type MensajeVuelo = { tipo: "listo" | "fin" | "error"; motivo?: string };

/** Interpreta un mensaje de la WebView sin fiarse de su contenido. Nunca devuelve ni registra datos con clave. */
export function leerMensajeVuelo(datos: unknown): MensajeVuelo | null {
  if (typeof datos !== "string" || datos.length > 2000) return null;
  try {
    const o = JSON.parse(datos) as { tipo?: unknown; motivo?: unknown };
    if (o.tipo === "listo" || o.tipo === "fin" || o.tipo === "error") {
      return { tipo: o.tipo, motivo: typeof o.motivo === "string" ? sinClave(o.motivo).slice(0, 40) : undefined };
    }
  } catch {
    return null;
  }
  return null;
}
