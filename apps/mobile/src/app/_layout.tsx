import { useFonts } from "expo-font";
import { Stack, usePathname, useRouter } from "expo-router";
import { useEffect } from "react";
import { Platform, View } from "react-native";
import { fuenteGazpacho } from "../gazpacho";
import { MobileProvider } from "../state";
import { tx } from "../textos";
import { MiniPlayer } from "../ui/MiniPlayer";
import { TabBar, type PestanaDef } from "../ui/TabBar";
import { useTema } from "../ui/tema";
import { useEpisodioCargado } from "../ui/useHoy";

const RUTAS_PESTANAS = ["/", "/camino", "/biblioteca", "/ajustes"];

function Shell() {
  const { c, lang, library } = useTema();
  const t = tx(lang);
  const path = usePathname();
  const router = useRouter();
  const cargado = useEpisodioCargado();
  const enPestana = RUTAS_PESTANAS.includes(path);
  const pestanas: PestanaDef[] = [
    { href: "/", icono: "hoy", etiqueta: t.tabHoy },
    { href: "/camino", icono: "caminos", etiqueta: t.tabCaminos },
    { href: "/biblioteca", icono: "biblioteca", etiqueta: t.tabBiblioteca },
    { href: "/ajustes", icono: "ajustes", etiqueta: t.tabAjustes },
  ];

  useEffect(() => {
    if (library.hydrated && !library.settings.bienvenidaHecha && path !== "/bienvenida") router.replace("/bienvenida");
  }, [library.hydrated, library.settings.bienvenidaHecha, path, router]);

  const avance = cargado ? library.progress.episodes[cargado.episodio.id] : undefined;
  const empezado = Boolean(cargado && (library.playing || (avance && !avance.completed && avance.positionSeconds >= 1)));
  const cabecera = { headerShown: true, title: "", headerBackButtonDisplayMode: "minimal" as const, headerStyle: { backgroundColor: c.bg }, headerTintColor: c.ink, headerShadowVisible: false };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg }, animation: Platform.OS === "web" ? "none" : "default" }}>
        <Stack.Screen name="descargas" options={cabecera} />
        <Stack.Screen name="avisos" options={cabecera} />
        <Stack.Screen name="notas" options={cabecera} />
        <Stack.Screen name="referencias" options={cabecera} />
        <Stack.Screen name="leer" options={cabecera} />
        <Stack.Screen name="creditos" options={cabecera} />
        <Stack.Screen name="reto-adviento" options={{ ...cabecera, headerTransparent: false }} />
        <Stack.Screen name="bienvenida" options={{ contentStyle: { backgroundColor: "#0C0B09" }, animation: "fade" }} />
        <Stack.Screen name="entrar" options={{ contentStyle: { backgroundColor: "#0C0B09" } }} />
        <Stack.Screen name="suscripcion" options={{ contentStyle: { backgroundColor: "#100E0C" } }} />
        <Stack.Screen name="eliminar-cuenta" options={{ contentStyle: { backgroundColor: "#0C0B09" } }} />
        <Stack.Screen name="ahora" options={{ presentation: "modal", contentStyle: { backgroundColor: "#0C0B09" }, animation: Platform.OS === "web" ? "none" : "slide_from_bottom" }} />
      </Stack>
      {enPestana && cargado && empezado ? (
        <MiniPlayer
          c={c}
          src={cargado.info.src}
          titulo={cargado.info.titulo}
          subtitulo={[cargado.info.libro, cargado.info.capitulos].filter(Boolean).join(" · ")}
          fraccion={Math.min(1, library.globalTime / Math.max(1, cargado.episodio.durationSeconds))}
          jugando={library.playing}
          etiquetaPlay={library.playing ? t.pausar : t.reproducir}
          onToggle={library.toggle}
          onAbrir={() => router.push("/ahora")}
        />
      ) : null}
      {enPestana ? <TabBar c={c} pestanas={pestanas} actual={path} onElegir={(href) => router.navigate(href as "/")} /> : null}
      {!library.hydrated ? <View pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: c.bg }} /> : null}
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
