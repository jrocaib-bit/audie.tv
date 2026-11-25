import { useFonts } from "expo-font";
import { Stack, usePathname, useRouter } from "expo-router";
import { useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { pendienteListo } from "../acceso";
import { Platform, View } from "react-native";
import { fuenteGazpacho } from "../gazpacho";
import { MobileProvider } from "../state";
import { textoErrorAudio, tx } from "../textos";
import { MiniPlayer } from "../ui/MiniPlayer";
import { RUTAS_PESTANAS, debeMostrarMini } from "../ui/mini";
import { HuecoInferiorContext, huecoInferior } from "../ui/barra-flotante";
import { TabBar, type PestanaDef } from "../ui/TabBar";
import { useTema } from "../ui/tema";
import { useEpisodioCargado } from "../ui/useHoy";
import { useCola } from "../ui/useCola";
import { useAuthEnlace } from "../ui/useAuthEnlace";
import { useReproducir } from "../ui/useReproducir";

function Shell() {
  const { c, lang, library } = useTema();
  const t = tx(lang);
  const path = usePathname();
  const router = useRouter();
  const cargado = useEpisodioCargado();
  const reproducir = useReproducir();
  const cola = useCola();
  const listoPendiente = pendienteListo(library.pendiente, Boolean(library.sesion));
  const enPestana = RUTAS_PESTANAS.includes(path);
  const insets = useSafeAreaInsets();
  const conMini = debeMostrarMini({ path, cargado: Boolean(cargado) }) && Boolean(cargado);
  const hueco = huecoInferior({ pestanas: enPestana, mini: conMini, insetInferior: insets.bottom });
  const pestanas: PestanaDef[] = [
    { href: "/", icono: "hoy", etiqueta: t.tabHoy },
    { href: "/camino", icono: "caminos", etiqueta: t.tabCaminos },
    { href: "/retos", icono: "retos", etiqueta: t.tabRetos },
    { href: "/biblioteca", icono: "biblioteca", etiqueta: t.tabBiblioteca },
    { href: "/libros", icono: "libro", etiqueta: t.tabLibros },
    { href: "/sala", icono: "sala", etiqueta: t.tabSala },
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

  const mini =
    conMini && cargado ? (
      <MiniPlayer
        c={c}
        sobrePestanas={enPestana}
        src={cargado.info.src}
        titulo={cargado.info.titulo}
        subtitulo={[cargado.info.libro, cargado.info.capitulos].filter(Boolean).join(" · ")}
        fraccion={Math.min(1, library.globalTime / Math.max(1, cargado.episodio.durationSeconds))}
        jugando={library.playing}
        cargando={library.estadoAudio === "cargando"}
        error={library.errorAudio ? textoErrorAudio(library.errorAudio, t) : undefined}
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
    ) : null;

  const cabecera = { headerShown: true, title: "", headerBackButtonDisplayMode: "minimal" as const, headerStyle: { backgroundColor: c.bg }, headerTintColor: c.ink, headerShadowVisible: false };

  return (
    <HuecoInferiorContext.Provider value={enPestana ? hueco : null}>
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg }, animation: Platform.OS === "web" ? "none" : "default" }}>
        <Stack.Screen name="descargas" options={cabecera} />
        <Stack.Screen name="notas" options={cabecera} />
        <Stack.Screen name="referencias" options={cabecera} />
        <Stack.Screen name="leer" options={cabecera} />
        <Stack.Screen name="creditos" options={cabecera} />
        <Stack.Screen name="reto/[id]" options={cabecera} />
        <Stack.Screen name="biblia" options={cabecera} />
        <Stack.Screen name="libros/[slug]" options={cabecera} />
        <Stack.Screen name="libros/[slug]/leer" options={cabecera} />
        <Stack.Screen name="bienvenida" options={{ contentStyle: { backgroundColor: "#0C0B09" }, animation: "fade" }} />
        <Stack.Screen name="entrar" options={{ contentStyle: { backgroundColor: "#0C0B09" } }} />
        <Stack.Screen name="suscripcion" options={{ contentStyle: { backgroundColor: "#100E0C" } }} />
        <Stack.Screen name="eliminar-cuenta" options={{ contentStyle: { backgroundColor: "#0C0B09" } }} />
        <Stack.Screen name="cuenta" options={{ presentation: "modal", contentStyle: { backgroundColor: "#0C0B09" }, animation: Platform.OS === "web" ? "none" : "slide_from_bottom" }} />
        <Stack.Screen name="cola" options={{ presentation: "modal", contentStyle: { backgroundColor: "#0C0B09" }, animation: Platform.OS === "web" ? "none" : "slide_from_bottom" }} />
        <Stack.Screen name="ahora" options={{ presentation: "modal", contentStyle: { backgroundColor: "#0C0B09" }, animation: Platform.OS === "web" ? "none" : "slide_from_bottom" }} />
      </Stack>
      </View>
      {enPestana ? (
        // En las pestañas, el mini reproductor y la píldora flotan sobre el contenido.
        <View pointerEvents="box-none" style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}>
          {mini}
          <TabBar c={c} pestanas={pestanas} actual={path} onElegir={(href) => router.navigate(href as "/")} />
        </View>
      ) : (
        mini
      )}
      {!library.hydrated ? <View pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: c.bg }} /> : null}
    </View>
    </HuecoInferiorContext.Provider>
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
      <AuthEnlace />
      <Shell />
    </MobileProvider>
  );
}

function AuthEnlace() {
  useAuthEnlace();
  return null;
}
