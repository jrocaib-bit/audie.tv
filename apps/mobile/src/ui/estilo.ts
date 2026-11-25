function aplanar(style: unknown): Record<string, unknown> {
  if (!style) return {};
  if (Array.isArray(style)) return style.reduce<Record<string, unknown>>((acc, item) => ({ ...acc, ...aplanar(item) }), {});
  return typeof style === "object" ? (style as Record<string, unknown>) : {};
}

const SOLO_FUERA = ["position", "top", "right", "bottom", "left", "start", "end", "zIndex", "margin", "marginTop", "marginBottom", "marginLeft", "marginRight", "marginHorizontal", "marginVertical", "marginStart", "marginEnd", "alignSelf"];
const AMBOS = ["flex", "flexGrow", "flexShrink", "flexBasis", "width", "height", "minWidth", "minHeight", "maxWidth", "maxHeight"];

/**
 * La caja que recibe el toque (Pressable) debe tener la posición y el tamaño del botón;
 * si no, el botón se ve pero no se puede pulsar. Lo visual va en el interior animado.
 */
export function repartirEstilo<T>(style: unknown): { fuera: T; dentro: T } {
  const plano = aplanar(style);
  const fuera: Record<string, unknown> = {};
  const dentro: Record<string, unknown> = {};
  for (const [clave, valor] of Object.entries(plano)) {
    if (SOLO_FUERA.includes(clave)) fuera[clave] = valor;
    else if (AMBOS.includes(clave)) {
      fuera[clave] = valor;
      dentro[clave] = typeof valor === "string" && valor.endsWith("%") && /^(width|height|min|max)/i.test(clave) ? "100%" : valor;
    } else dentro[clave] = valor;
  }
  return { fuera: fuera as T, dentro: dentro as T };
}

