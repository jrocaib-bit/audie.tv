import { esIdioma, type Idioma } from "./idioma";
import { isPlaybackRate, type PlaybackRate } from "./player";

export type ThemeChoice = "system" | "light" | "dark";
export type TextScale = "sm" | "md" | "lg" | "xl";
export type DailyMinutes = 10 | 15 | 20 | 30;
export type UiLocale = Idioma;

export type Settings = {
  version: 1;
  theme: ThemeChoice;
  textScale: TextScale;
  reduceMotion: boolean;
  captions: boolean;
  rate: PlaybackRate;
  dailyMinutes: DailyMinutes;
  uiLocale: UiLocale;
  localeElegido: boolean;
  /** Camino activo (id corto). Los ajustes antiguos no lo traen: vale "biblia". */
  caminoActivo: string;
  /** La bienvenida solo se enseña la primera vez. */
  bienvenidaHecha: boolean;
};

export const STORAGE_KEYS = {
  settings: "audite.settings.v1",
  progress: "audite.progress.v1",
  path: "audite.path.v1",
  current: "audite.current.v1",
} as const;

export const CAMINO_DEFECTO = "biblia";

export function idCaminoValido(value: unknown): value is string {
  return typeof value === "string" && /^[a-z0-9-]{1,32}$/.test(value);
}

export function defaultSettings(): Settings {
  return {
    version: 1,
    theme: "dark",
    textScale: "md",
    reduceMotion: false,
    captions: true,
    rate: 1,
    dailyMinutes: 15,
    uiLocale: "es",
    localeElegido: false,
    caminoActivo: CAMINO_DEFECTO,
    bienvenidaHecha: false,
  };
}

function isTextScale(value: unknown): value is TextScale {
  return value === "sm" || value === "md" || value === "lg" || value === "xl";
}

function isDailyMinutes(value: unknown): value is DailyMinutes {
  return value === 10 || value === 15 || value === 20 || value === 30;
}

export function parseSettings(value: unknown): Settings {
  const defaults = defaultSettings();
  if (!value || typeof value !== "object") return defaults;
  const record = value as Record<string, unknown>;
  return {
    version: 1,
    theme: record.theme === "light" || record.theme === "dark" || record.theme === "system" ? record.theme : defaults.theme,
    textScale: isTextScale(record.textScale) ? record.textScale : defaults.textScale,
    reduceMotion: record.reduceMotion === true,
    captions: record.captions !== false,
    rate: isPlaybackRate(record.rate) ? record.rate : defaults.rate,
    dailyMinutes: isDailyMinutes(record.dailyMinutes) ? record.dailyMinutes : defaults.dailyMinutes,
    uiLocale: esIdioma(typeof record.uiLocale === "string" ? record.uiLocale : null) ? record.uiLocale as Settings["uiLocale"] : defaults.uiLocale,
    localeElegido: record.localeElegido === true,
    caminoActivo: idCaminoValido(record.caminoActivo) ? record.caminoActivo : defaults.caminoActivo,
    bienvenidaHecha: record.bienvenidaHecha === true,
  };
}
