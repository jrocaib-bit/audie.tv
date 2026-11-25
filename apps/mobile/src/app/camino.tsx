import { Redirect } from "expo-router";
import { REDIRECCIONES } from "../ui/pestanas";

/** Ruta vieja. Lleva a su sitio nuevo sin apilar historial. */
export default function CaminoRedirect() {
  return <Redirect href={REDIRECCIONES["/camino"]} />;
}
