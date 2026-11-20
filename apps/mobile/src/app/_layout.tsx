import { useFonts } from "expo-font";
import { Stack, usePathname, useRouter } from "expo-router";
import { useEffect } from "react";
import { pendienteListo } from "../acceso";
import { Platform, View } from "react-native";
import { fuenteGazpacho } from "../gazpacho";
import { MobileProvider } from "../state";
import { tx } from "../textos";
import { MiniPlayer } from "../ui/MiniPlayer";
import { RUTAS_PESTANAS, debeMostrarMini } from "../ui/mini";
import { TabBar, type PestanaDef } from "../ui/TabBar";
import { useTema } from "../ui/tema";
import { useEpisodioCargado, useModeloHoy } from "../ui/useHoy";
import { useCola } from "../ui/useCola";
import { useReproducir } from "../ui/useReproducir";

function Shell() {
  const { c, lang, library } = useTema();
  const t = tx(lang);
  const path = usePathname();
  const router = useRouter();
  const cargado = useEpisodioCargado();
  const hoy = useModeloHoy();
  const reproducir = useReproducir();
  const cola = useCola();
  const listoPendiente = pendienteListo(library.pendiente, Boolean(library.sesion));
  const enPestana = RUTAS_PESTANAS.includes(path);
  const pestanas: PestanaDef[] = [
    { href: "/", icono: "hoy", etiqueta: t.tabHoy },
    { href: "/camino", icono: "caminos", etiqueta: t.tabCaminos },
    { href: "/retos", icono: "retos", etiqueta: t.tabRetos },
    { href: "/biblioteca", icono: "biblioteca", etiqueta: t.tabBiblioteca },
  ];

  useEffect(() => {
    if (library.hydrated && !library.settings.bienvenidaHecha && path !== "/bienvenida") router.replace("/bienvenida");
  }, [library.hydrated, library.settings.bienvenidaHecha, path, router]);

  // Al aparecer la sesión se cierra la hoja de cuenta y arranca lo que se quiso escuchar.
  useEffect(() => {
    if (!listoPendiente) return;
    library.setPendiente(null);
    if (path === "/cuenta") router.back();
    const espera = setTimeout(() => {
      library.playEpisode(listoPendiente);
      router.navigate("/ahora");
    }, 150);
    return () => clearTimeout(espera);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listoPendiente]);

  const avance = cargado ? library.progress.episodes[cargado.episodio.id] : undefined;
  const empezado = Boolean(cargado && (library.playing || library.estadoAudio === "cargando" || library.estadoAudio === "error" || (avance && !avance.completed && avance.positionSeconds >= 1)));
  // En Hoy, si la tarjeta principal ya es este episodio y no suena, no se repite abajo.
  const repetido = path === "/" && hoy.hero?.id === cargado?.episodio.id && !library.playing;
  const cabecera = { headerShown: true, title: "", headerBackButtonDisplayMode: "minimal" as const, headerStyle: { backgroundColor: c.bg }, headerTintColor: c.ink, headerShadowVisible: false };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg }, animation: Platform.OS === "web" ? "none" : "default" }}>
        <Stack.Screen name="descargas" options={cabecera} />
        <Stack.Screen name="notas" options={cabecera} />
        <Stack.Screen name="referencias" options={cabecera} />
        <Stack.Screen name="leer" options={cabecera} />
        <Stack.Screen name="creditos" options={cabecera} />
        <Stack.Screen name="reto/[id]" options={cabecera} />
        <Stack.Screen name="bienvenida" options={{ contentStyle: { backgroundColor: "#0C0B09" }, animation: "fade" }} />
        <Stack.Screen name="entrar" options={{ contentStyle: { backgroundColor: "#0C0B09" } }} />
        <Stack.Screen name="suscripcion" options={{ contentStyle: { backgroundColor: "#100E0C" } }} />
        <Stack.Screen name="eliminar-cuenta" options={{ contentStyle: { backgroundColor: "#0C0B09" } }} />
        <Stack.Screen name="cuenta" options={{ presentation: "modal", contentStyle: { backgroundColor: "#0C0B09" }, animation: Platform.OS === "web" ? "none" : "slide_from_bottom" }} />
        <Stack.Screen name="cola" options={{ presentation: "modal", contentStyle: { backgroundColor: "#0C0B09" }, animation: Platform.OS === "web" ? "none" : "slide_from_bottom" }} />
        <Stack.Screen name="ahora" options={{ presentation: "modal", contentStyle: { backgroundColor: "#0C0B09" }, animation: Platform.OS === "web" ? "none" : "slide_from_bottom" }} />
      </Stack>
      {debeMostrarMini({ path, cargado: Boolean(cargado), empezado, repetido }) && cargado ? (
        <MiniPlayer
          c={c}
          sobrePestanas={enPestana}
          src={cargado.info.src}
          titulo={cargado.info.titulo}
          subtitulo={[cargado.info.libro, cargado.info.capitulos].filter(Boolean).join(" · ")}
          fraccion={Math.min(1, library.globalTime / Math.max(1, cargado.episodio.durationSeconds))}
          jugando={library.playing}
          cargando={library.estadoAudio === "cargando"}
          error={library.errorAudio ? (library.errorAudio === "entrar" ? t.entrarParaEscuchar : library.errorAudio === "premium" ? t.conPremium : library.errorAudio === "proximamente" ? t.proximamente : t.noCargo) : undefined}
          etiquetaPlay={library.playing ? t.pausar : t.reproducir}
          onToggle={() => {
            if (library.playing) library.toggle();
            else if (!library.sesion) reproducir(cargado.episodio.id);
            else if (library.errorAudio) library.reintentar();
            else library.toggle();
          }}
          haySiguiente={cola.haySiguiente}
          onSiguiente={library.siguiente}
          etiquetaSiguiente={t.siguiente}
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
