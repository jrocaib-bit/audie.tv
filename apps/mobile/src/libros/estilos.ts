import { Platform } from "react-native";

/** Serif de sistema para el cuerpo de lectura. Nunca SF Pro forzado ni Gazpacho. */
export const LETRA = Platform.select({ ios: "Georgia", android: "serif", default: "Georgia, Palatino, serif" }) as string;

export const TAMANOS = [16, 18, 20, 23] as const;
