import { CLAVE_AVISOS, parsePlanAviso, type PlanAviso } from "@audite/domain";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { programarAvisosLocales } from "./avisos";

export async function leerPlan(): Promise<PlanAviso> {
  const raw = await AsyncStorage.getItem(CLAVE_AVISOS);
  if (!raw) return parsePlanAviso(null);
  try {
    return parsePlanAviso(JSON.parse(raw) as unknown);
  } catch {
    return parsePlanAviso(null);
  }
}

/** Guarda el plan y programa avisos locales. En web solo se guarda. */
export async function guardarRecordatorio(plan: PlanAviso, texto: string): Promise<number> {
  await AsyncStorage.setItem(CLAVE_AVISOS, JSON.stringify(plan));
  if (Platform.OS === "web") return 0;
  try {
    return await programarAvisosLocales(plan, texto);
  } catch {
    return 0;
  }
}
