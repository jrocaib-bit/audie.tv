import { Platform } from "react-native";
import type { OfertaStore, Transaccion } from "./tienda";

export async function leerTienda(skus: readonly string[]): Promise<OfertaStore[] | null> {
  if (Platform.OS === "web" || __DEV__) return null;
  const nativo = await import("./storekit-nativo");
  return nativo.leerTienda(skus);
}

export async function comprarNativo(id: string, userId: string): Promise<void> {
  if (Platform.OS === "web" || __DEV__) return;
  const nativo = await import("./storekit-nativo");
  await nativo.comprar(id, userId);
}

export async function restaurarNativo(): Promise<Transaccion[]> {
  if (Platform.OS === "web" || __DEV__) return [];
  const nativo = await import("./storekit-nativo");
  return nativo.restaurar();
}
