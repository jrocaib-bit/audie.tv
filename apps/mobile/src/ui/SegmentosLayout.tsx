import { Stack, usePathname, useRouter } from "expo-router";
import { Platform, View } from "react-native";
import { SafeAreaInsetsContext, useSafeAreaInsets } from "react-native-safe-area-context";
import { tx } from "../textos";
import { segmentoActivo, type Pestana } from "./pestanas";
import { Segmentado } from "./Segmentado";
import { useTema } from "./tema";

/**
 * Layout de una pestaña con segmentos. Arriba el segmentado, debajo la vista del segmento.
 * Cada segmento es una ruta propia, así que el segmento queda en la URL y se puede enlazar.
 * La vista de debajo ya no necesita reservar el margen superior del sistema: lo ocupa el segmentado.
 */
export function SegmentosLayout({ pestana }: { pestana: Pestana }) {
  const { c, lang } = useTema();
  const t = tx(lang);
  const path = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const segmentos = pestana.segmentos ?? [];
  const activo = segmentoActivo(segmentos, path);
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ paddingTop: insets.top + 10, paddingHorizontal: 20, paddingBottom: 2, backgroundColor: c.bg }}>
        <Segmentado
          c={c}
          etiqueta={t[pestana.etiqueta]}
          opciones={segmentos.map((s) => ({ href: s.href, etiqueta: t[s.etiqueta] }))}
          activo={activo.href}
          // Cambiar de segmento sustituye la ruta: no apila historial.
          onElegir={(href) => {
            if (href !== path) router.replace(href as "/");
          }}
        />
      </View>
      <SafeAreaInsetsContext.Provider value={{ ...insets, top: 0 }}>
        <View style={{ flex: 1 }}>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg }, animation: Platform.OS === "web" ? "none" : "fade" }} />
        </View>
      </SafeAreaInsetsContext.Provider>
    </View>
  );
}
