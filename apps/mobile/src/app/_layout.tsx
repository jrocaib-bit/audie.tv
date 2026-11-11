import { useFonts } from "expo-font";
import { t } from "@audite/domain";
import { Stack, usePathname, useRouter } from "expo-router";
import { Platform, Pressable, Text, View, useColorScheme } from "react-native";
import { Mark, Wordmark } from "../brand";
import { fuenteGazpacho } from "../gazpacho";
import { MobileProvider, useMobileLibrary } from "../state";
import { dark, fonts, light } from "../theme";

const tabs = [
  { href: "/", label: "navListen" },
  { href: "/camino", label: "navPath" },
  { href: "/biblioteca", label: "navLibrary" },
  { href: "/ajustes", label: "navSettings" },
] as const;

function Shell() {
  const library = useMobileLibrary();
  const scheme = useColorScheme();
  const path = usePathname();
  const router = useRouter();
  const colors = library.settings.theme === "dark" || (library.settings.theme === "system" && scheme === "dark") ? dark : light;
  const locale = library.settings.uiLocale;
  const immersive = path === "/ahora" || path === "/entrar" || path === "/suscripcion" || path === "/eliminar-cuenta";
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: immersive ? colors.gallery : colors.bg },
          headerTintColor: immersive ? "#f4ece2" : colors.ink,
          contentStyle: { backgroundColor: immersive ? colors.gallery : colors.bg },
          headerShadowVisible: false,
          headerTitle: () => (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Mark color={immersive ? "#f4ece2" : colors.ink} paper={immersive ? colors.gallery : colors.bg} />
              <Wordmark color={immersive ? "#f4ece2" : colors.ink} />
            </View>
          ),
        }}
      >
        <Stack.Screen name="index" options={{ title: t(locale, "wordmark") }} />
        <Stack.Screen name="camino" />
        <Stack.Screen name="biblioteca" />
        <Stack.Screen name="ajustes" />
        <Stack.Screen name="descargas" />
        <Stack.Screen name="avisos" />
        <Stack.Screen name="notas" />
        <Stack.Screen name="referencias" />
        <Stack.Screen name="leer" />
        <Stack.Screen name="entrar" options={{ headerShown: false }} />
        <Stack.Screen name="suscripcion" options={{ headerShown: false }} />
        <Stack.Screen name="eliminar-cuenta" options={{ headerShown: false }} />
        <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
        <Stack.Screen name="ahora" options={{ headerShown: false }} />
        <Stack.Screen name="catalogo" options={{ headerShown: false }} />
        <Stack.Screen name="reto-adviento" options={{ title: t(locale, "navPath") }} />
      </Stack>
      {immersive ? null : (
        <View style={{ flexDirection: "row", borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.bg }}>
          {tabs.map((tab) => {
            const current = tab.href === "/" ? path === "/" : path === tab.href;
            return (
              <Pressable
                key={tab.href}
                accessibilityRole="tab"
                accessibilityState={{ selected: current }}
                accessibilityLabel={t(locale, tab.label)}
                onPress={() => router.push(tab.href)}
                style={{ flex: 1, minHeight: 56, alignItems: "center", justifyContent: "center" }}
              >
                <Text style={{ color: current ? colors.ink : colors.muted, fontFamily: fonts.medium, fontSize: 12 }}>{t(locale, tab.label)}</Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

export default function Layout() {
  const fuentes: Record<string, number | string> = {};
  if (Platform.OS !== "ios") fuentes.Inter = require("../../assets/fonts/inter/InterVariable.ttf") as number;
  if (fuenteGazpacho) fuentes.Gazpacho = fuenteGazpacho;
  const [listas] = useFonts(fuentes);
  if (!listas) return null;
  return (
    <MobileProvider>
      <Shell />
    </MobileProvider>
  );
}
