import { anotacionesVacias, parseAnotaciones, type AnotacionesLibro } from "@audite/domain";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AJUSTES_INICIALES, parseAjustes, type AjustesLector } from "./ajustes";

const clave = (libroId: string) => `audite.libros.v1.${libroId}`;
const CLAVE_AJUSTES = "audite.libros.ajustes.v1";


export async function leerAnotacionesLocales(libroId: string): Promise<AnotacionesLibro> {
  try {
    return parseAnotaciones(JSON.parse((await AsyncStorage.getItem(clave(libroId))) ?? "null"), libroId);
  } catch {
    return anotacionesVacias();
  }
}

export async function guardarAnotacionesLocales(libroId: string, datos: AnotacionesLibro): Promise<void> {
  try {
    await AsyncStorage.setItem(clave(libroId), JSON.stringify(datos));
  } catch {
    // Sin almacenamiento: se lee igual, no se guarda.
  }
}

export async function leerAjustes(): Promise<AjustesLector> {
  try {
    return parseAjustes(JSON.parse((await AsyncStorage.getItem(CLAVE_AJUSTES)) ?? "null"));
  } catch {
    return AJUSTES_INICIALES;
  }
}

export async function guardarAjustes(ajustes: AjustesLector): Promise<void> {
  try {
    await AsyncStorage.setItem(CLAVE_AJUSTES, JSON.stringify(ajustes));
  } catch {
    // Sin almacenamiento.
  }
}

/** Líneas medidas de un capítulo (solo números, nunca texto). Se guardan por libro, capítulo, tamaño y ancho. */
export async function leerMedidas(clave: string): Promise<number[] | null> {
  try {
    const dato = JSON.parse((await AsyncStorage.getItem(clave)) ?? "null") as unknown;
    return Array.isArray(dato) && dato.every((n) => typeof n === "number" && n >= 1 && n < 10000) ? (dato as number[]) : null;
  } catch {
    return null;
  }
}

export async function guardarMedidas(clave: string, lineas: number[]): Promise<void> {
  try {
    await AsyncStorage.setItem(clave, JSON.stringify(lineas));
  } catch {
    // Sin almacenamiento.
  }
}
