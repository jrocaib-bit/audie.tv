import type { ImageSourcePropType } from "react-native";
import { uriDeObra } from "./entorno";

/**
 * Portadas y días de Profecías van en el bundle: no dependen de audite.tv ni de un
 * despliegue web. El resto de /obras (Adviento, Navidad) sigue en la web, que ya las sirve.
 */
const OBRAS_EN_BUNDLE: Record<string, number> = {
  "/obras/reto-profecias_o1-1x1.webp": require("../assets/obras/reto-profecias_o1-1x1.webp"),
  "/obras/reto-profecias_o1-4x5.webp": require("../assets/obras/reto-profecias_o1-4x5.webp"),
  "/obras/reto-profecias_pp-01.webp": require("../assets/obras/reto-profecias_pp-01.webp"),
  "/obras/reto-profecias_pp-02.webp": require("../assets/obras/reto-profecias_pp-02.webp"),
  "/obras/reto-profecias_pp-03.webp": require("../assets/obras/reto-profecias_pp-03.webp"),
  "/obras/reto-profecias_pp-04.webp": require("../assets/obras/reto-profecias_pp-04.webp"),
  "/obras/reto-profecias_pp-05.webp": require("../assets/obras/reto-profecias_pp-05.webp"),
  "/obras/reto-profecias_pp-06.webp": require("../assets/obras/reto-profecias_pp-06.webp"),
  "/obras/reto-profecias_pp-07.webp": require("../assets/obras/reto-profecias_pp-07.webp"),
  "/obras/reto-profecias_pp-08.webp": require("../assets/obras/reto-profecias_pp-08.webp"),
};

export function fuenteDeObra(src: string, base?: string): ImageSourcePropType {
  const local = OBRAS_EN_BUNDLE[src];
  if (local) return local;
  return { uri: uriDeObra(src, base) };
}
