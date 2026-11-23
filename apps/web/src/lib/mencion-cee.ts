/** Apagado salvo que el entorno diga exactamente "true". */
export function mencionCeeActiva(valor: string | undefined = process.env.NEXT_PUBLIC_MENCION_CEE): boolean {
  return valor === "true";
}

/** Una línea de atribución. Sin texto bíblico. Solo con el interruptor encendido. */
export function lineaCee(lang: "es" | "en", activo = mencionCeeActiva()): string | null {
  if (!activo) return null;
  return lang === "en"
    ? "Spanish audio follows the Sagrada Biblia, the official version of the Spanish Episcopal Conference."
    : "El audio en español sigue la Sagrada Biblia, versión oficial de la Conferencia Episcopal Española.";
}
