const audio = {
  "ES_p1_original.mp3": require("../../../content/pilot/audio/ES_p1_original.mp3"),
  "ES_p2_original.mp3": require("../../../content/pilot/audio/ES_p2_original.mp3"),
} as const;

const art = {
  "A03_adan.jpg": require("../../../content/pilot/assets/A03_adan.jpg"),
  "A05_geometra.jpg": require("../../../content/pilot/assets/A05_geometra.jpg"),
  "A06_eden_presentacion_detalle.jpg": require("../../../content/pilot/assets/A06_eden_presentacion_detalle.jpg"),
  "A06_eden_tabla_izquierda.jpg": require("../../../content/pilot/assets/A06_eden_tabla_izquierda.jpg"),
  "A11_animales_CC0.jpg": require("../../../content/pilot/assets/A11_animales_CC0.jpg"),
} as const;

function fileName(publicPath: string): string {
  const name = publicPath.split("/").pop();
  if (!name) throw new Error(`Missing file name in ${publicPath}`);
  return name;
}

export function audioAsset(publicPath: string): number {
  const name = fileName(publicPath);
  if (!(name in audio)) throw new Error(`No bundled audio for ${name}`);
  return audio[name as keyof typeof audio];
}

export function artAsset(publicPath: string): number | null {
  const name = fileName(publicPath);
  if (!(name in art)) return null;
  return art[name as keyof typeof art];
}
