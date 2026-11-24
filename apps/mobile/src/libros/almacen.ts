import { anotacionesVacias, parseAnotaciones, type AnotacionesLibro } from "@audite/domain";
import AsyncStorage from "@react-native-async-storage/async-storage";

const clave = (libroId: string) => `audite.libros.v1.${libroId}`;
const CLAVE_AJUSTES = "audite.libros.ajustes.v1";

export type AjustesLector = { tam: number; noche: boolean | null };

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
    const dato = JSON.parse((await AsyncStorage.getItem(CLAVE_AJUSTES)) ?? "null") as Partial<AjustesLector> | null;
    return { tam: typeof dato?.tam === "number" && dato.tam >= 0 && dato.tam <= 3 ? Math.trunc(dato.tam) : 1, noche: typeof dato?.noche === "boolean" ? dato.noche : null };
  } catch {
    return { tam: 1, noche: null };
  }
}

export async function guardarAjustes(ajustes: AjustesLector): Promise<void> {
  try {
    await AsyncStorage.setItem(CLAVE_AJUSTES, JSON.stringify(ajustes));
  } catch {
    // Sin almacenamiento.
  }
}
