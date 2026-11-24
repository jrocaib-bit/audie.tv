import { useColorScheme } from "react-native";
import { useMobileLibrary } from "../state";
import { dark, light } from "../theme";

export function useColoresLibros() {
  const library = useMobileLibrary();
  const esquema = useColorScheme();
  const oscuro = library.settings.theme === "dark" || (library.settings.theme === "system" && esquema === "dark");
  return oscuro ? dark : light;
}
