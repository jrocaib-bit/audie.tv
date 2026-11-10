function fuente(valor: unknown): number | string | null {
  if (typeof valor === "number" || (typeof valor === "string" && valor.length > 0)) return valor;
  if (valor && typeof valor === "object") {
    if ("default" in valor) return fuente((valor as { default: unknown }).default);
    if ("uri" in valor && typeof (valor as { uri: unknown }).uri === "string") return (valor as { uri: string }).uri;
  }
  return null;
}

let cargada: unknown = null;
try {
  cargada = require("../../assets/fonts/private/Gazpacho-Heavy.otf");
} catch {
  cargada = null;
}

/** Asset del OTF privado. Si no está en disco, null y la app usa Georgia. */
export const fuenteGazpacho: number | string | null = fuente(cargada);
