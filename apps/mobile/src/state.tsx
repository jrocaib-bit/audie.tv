import indiceJson from "../../../content/canon/catalogo-indice.json";
import genesisJson from "../../../content/canon/libros/gn.json";
import {
  STORAGE_KEYS,
  addToPath,
  dailyListening,
  formatSleepRemaining,
  localIsoDate,
  recordListeningDay,
  sleepDeadline,
  sleepHasElapsed,
  defaultSettings,
  emptyPath,
  emptyProgress,
  parsePath,
  migrarCamino,
  migrarProgreso,
  parseProgress,
  parseSettings,
  esIdiomaInterfaz,
  idiomaDeEtiqueta,
  tieneAudioEn,
  playableIds,
  playableEpisodes,
  recordListen,
  removeFromPath,
  resumePosition,
  sanitizePath,
  segmentAt,
  urisDeReproduccion,
  type AppCatalog,
  type Episode,
  type DailyPlan,
  type ListeningPath,
  type PlaybackRate,
  type ProgressState,
  type Sesion,
  type Settings,
  type SleepMinutes,
} from "@audite/domain";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";
import { parseEpisodioActual } from "./actual";
import { decidirReproduccion, episodiosDeReto } from "./acceso";
import { crearCacheAudio, necesitaRenovar, resolverAudio, type CacheAudio, type ErrorAudio } from "./audio-url";
import { supabaseApp, tokenAcceso } from "./auth";
import { CLAVE_COLA, CONTEXTO_DEFECTO, construirCola, infoPaso, parseContexto, planVentana, posicionEn, textoContexto, vecino, type ContextoCola, type FuentesCola, type NombresCola } from "./cola";
import { datosDeReto } from "./temporadas";
import { leerDescargas } from "./descargas";
import { obraDeEpisodio, obraWebp } from "../../../packages/content/src/obras-visibles";
import { baseDeContenido, uriDeObra } from "./entorno";
import { setAudioModeAsync, useAudioPlaylist, useAudioPlaylistStatus } from "expo-audio";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";
const contentBase = baseDeContenido();

const indice = indiceJson as AppCatalog;
const genesis = genesisJson as { episodios: AppCatalog["pendientes"] };
export const catalog: AppCatalog = { ...indice, pendientes: genesis.episodios, rangos: indice.rangos ?? [] };

const reproducibles = playableEpisodes(catalog);
const episodiosPorId = new Map(reproducibles.map((item) => [item.id, item]));
const fuentesCola: FuentesCola = { rangos: catalog.rangos, pasosReto: episodiosDeReto };
const nombresCola: NombresCola = {
  libro: (id, lang) => catalog.books.find((libro) => libro.id === id)?.name[lang],
  reto: (id) => {
    const reto = datosDeReto(id);
    return reto ? (reto.tituloCorto ?? reto.titulo) : undefined;
  },
};
const grabado = (id: string) => episodiosPorId.has(id);

type MobileLibrary = {
  catalog: AppCatalog;
  settings: Settings;
  progress: ProgressState;
  path: ListeningPath;
  hydrated: boolean;
  daily: DailyPlan;
  globalTime: number;
  playing: boolean;
  updateSettings: (patch: Partial<Settings>) => void;
  addEpisode: (id: string) => void;
  removeEpisode: (id: string) => void;
  /** Episodio cargado en el reproductor. */
  currentEpisode: Episode | null;
  /** Episodio cuyo audio se ha cargado en esta sesión. */
  cargadoId: string | null;
  /** True si hay un episodio explícitamente guardado o seleccionado por el usuario. */
  tieneActualGuardado: boolean;
  /** Sesión de la cuenta (null si no se ha entrado). */
  sesion: Sesion | null;
  /** Episodio que se quiso escuchar sin cuenta; arranca solo al entrar. */
  pendiente: string | null;
  setPendiente: (id: string | null) => void;
  /** Estado de la carga del audio del episodio actual. */
  estadoAudio: "inactivo" | "cargando" | "listo" | "error";
  errorAudio: ErrorAudio | null;
  /** Carga el episodio y lo reproduce. Si ya es el actual, solo reanuda. */
  playEpisode: (id: string, opciones?: { contexto?: ContextoCola; pos?: number }) => void;
  /** Cola de escucha del contexto (reto, camino o libro) y posición actual. */
  contexto: ContextoCola;
  colaIds: string[];
  posCola: number;
  siguiente: () => void;
  anterior: () => void;
  irAPos: (pos: number) => void;
  /** Vuelve a pedir el audio del episodio actual. */
  reintentar: () => void;
  toggle: () => void;
  seekBy: (delta: number) => void;
  /** Salta a un segundo de la línea de tiempo del episodio. */
  seek: (seconds: number) => void;
  restart: () => void;
  setRate: (rate: PlaybackRate) => void;
  setSleep: (minutes: SleepMinutes | null) => void;
  sleepLabel: string | null;
};

const CLAVE_PENDIENTE = "audite.pendiente.v1";

const MobileContext = createContext<MobileLibrary | null>(null);

export function useMobileLibrary(): MobileLibrary {
  const value = useContext(MobileContext);
  if (!value) throw new Error("useMobileLibrary must be used inside MobileProvider");
  return value;
}

async function readJson(key: string): Promise<unknown> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

export function MobileProvider({ children }: { children: React.ReactNode }) {
  const primero = reproducibles[0] ?? null;
  // La lista empieza vacía: el audio se pide (URL firmada) solo cuando se pulsa play.
  const playlist = useAudioPlaylist({ sources: [], loop: "none", updateInterval: 250 });
  const status = useAudioPlaylistStatus(playlist);
  const statusRef = useRef(status);
  statusRef.current = status;
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [progress, setProgress] = useState<ProgressState>(emptyProgress);
  const [path, setPath] = useState<ListeningPath>(emptyPath);
  const [hydrated, setHydrated] = useState(false);
  const [sleepUntil, setSleepUntil] = useState<number | null>(null);
  const [clock, setClock] = useState(() => Date.now());
  const [currentId, setCurrentId] = useState<string | null>(primero?.id ?? null);
  const [tieneActualGuardado, setTieneActualGuardado] = useState(false);
  /** Episodio cuyo audio está de verdad en la lista de reproducción. */
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [estadoAudio, setEstadoAudio] = useState<"inactivo" | "cargando" | "listo" | "error">("inactivo");
  const [errorAudio, setErrorAudio] = useState<ErrorAudio | null>(null);
  const cacheAudio = useRef(crearCacheAudio());
  /** Caducidad de la URL firmada de cada episodio de la lista nativa (las descargas locales no caducan). */
  const expirasRef = useRef(new Map<string, number>());
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const sesionRef = useRef<Sesion | null>(null);
  sesionRef.current = sesion;
  const [pendiente, setPendienteEstado] = useState<string | null>(null);
  const setPendiente = useCallback((id: string | null) => {
    setPendienteEstado(id);
    if (id) void AsyncStorage.setItem(CLAVE_PENDIENTE, id);
    else void AsyncStorage.removeItem(CLAVE_PENDIENTE);
  }, []);
  const ids = useMemo(() => playableIds(catalog), []);
  const episode = (currentId ? episodiosPorId.get(currentId) : null) ?? primero;
  const progressRef = useRef(progress);
  progressRef.current = progress;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const loadToken = useRef(0);
  const ultimoTerminado = useRef<string | null>(null);
  const currentIdRef = useRef<string | null>(null);
  const loadedIdRef = useRef<string | null>(null);
  currentIdRef.current = currentId;
  loadedIdRef.current = loadedId;
  /** Hasta que no suena, la posición del reproductor puede ser la del episodio anterior. */
  const playedSinceLoad = useRef(false);

  const fallar = useCallback((error: ErrorAudio) => {
    console.warn(`[audio] ${error}`);
    setErrorAudio(error);
    setEstadoAudio("error");
  }, []);

  // Cola de escucha: de dónde viene lo que suena. Manda siguiente y anterior.
  const [contexto, setContextoEstado] = useState<ContextoCola>(CONTEXTO_DEFECTO);
  const contextoRef = useRef(contexto);
  contextoRef.current = contexto;
  const colaIds = useMemo(() => construirCola(contexto, fuentesCola), [contexto]);
  const colaRef = useRef(colaIds);
  colaRef.current = colaIds;
  const fijarContexto = useCallback((siguienteContexto: ContextoCola) => {
    contextoRef.current = siguienteContexto;
    colaRef.current = construirCola(siguienteContexto, fuentesCola);
    setContextoEstado(siguienteContexto);
    void AsyncStorage.setItem(CLAVE_COLA, JSON.stringify(siguienteContexto));
  }, []);
  const posCola = Math.min(Math.max(contexto.pos ?? 0, 0), Math.max(colaIds.length - 1, 0));

  // Ventana nativa: [anterior?, actual, siguientes…] con URL firmada ya resuelta. Solo se añade al final
  // (insertar o quitar antes del actual reconstruye la lista y corta el audio).
  const ventanaRef = useRef<string[]>([]);
  const indiceEsperado = useRef(0);
  const cargadoEn = useRef(0);
  const ultimaPosicion = useRef({ id: "", t: 0, dur: 0 });

  const completado = useCallback((id: string) => Boolean(progressRef.current.episodes[id]?.completed), []);

  const metadatos = useCallback((id: string) => {
    const ep = episodiosPorId.get(id);
    const lang = settingsRef.current.uiLocale === "en" ? "en" : "es";
    const info = infoPaso(colaRef.current, contextoRef.current.pos ?? 0, completado);
    const obra = obraDeEpisodio(id);
    return {
      title: (lang === "en" ? ep?.tituloCorto?.en : ep?.tituloCorto?.es) || ep?.title || id,
      artist: textoContexto(contextoRef.current, info, lang, nombresCola, { palabra: "paso" }),
      albumTitle: `Audite${obra?.capitulos ? ` · ${obra.capitulos}` : ""}`,
      artworkUrl: obra ? uriDeObra(obraWebp(obra)) : undefined,
    };
  }, [completado]);

  /** Metadatos y botones de la pantalla de bloqueo. Hay que reenviarlos al cambiar la disponibilidad. */
  const refrescarBloqueo = useCallback(
    (indice: number) => {
      const id = ventanaRef.current[indice];
      if (!id) return;
      try {
        playlist.setActiveForLockScreen(true, metadatos(id), {
          showNextTrack: indice < ventanaRef.current.length - 1,
          showPreviousTrack: indice > 0,
          showSeekBackward: true,
          showSeekForward: true,
          seekBackwardIntervalSeconds: 15,
          seekForwardIntervalSeconds: 15,
        });
      } catch (error) {
        console.warn("[audio] pantalla de bloqueo", error);
      }
    },
    [metadatos, playlist],
  );

  /** URL reproducible de un episodio: descarga local o URL firmada. null si no se puede. */
  const resolverUri = useCallback(async (id: string, archivos: Awaited<ReturnType<typeof leerDescargas>>, cache: CacheAudio): Promise<{ ok: true; uri: string } | { ok: false; error: ErrorAudio }> => {
    const ep = episodiosPorId.get(id);
    if (!ep) return { ok: false, error: "proximamente" };
    expirasRef.current.delete(id);
    const local = urisDeReproduccion(id, ep.segments.map((segment) => ({ id: segment.id, remoto: `${contentBase}${segment.publicPath}` })), archivos);
    if (local.origen === "local" && local.uris[0]) return { ok: true, uri: local.uris[0] };
    const resultado = await resolverAudio(id, { base: contentBase, token: await tokenAcceso(), fetch: (url, init) => fetch(url, init), cache });
    if (resultado.ok) expirasRef.current.set(id, resultado.expira);
    return resultado.ok ? { ok: true, uri: resultado.url } : { ok: false, error: resultado.error };
  }, []);

  /** Añade al final de la lista nativa los siguientes que se puedan escuchar. Se detiene en el primero que falle. */
  const ampliarVentana = useCallback(
    async (token: number, pos: number) => {
      const archivos = await leerDescargas();
      const querido = planVentana(colaRef.current, pos, grabado, 2).siguientes;
      const indiceActual = indiceEsperado.current;
      for (let k = 0; k < querido.length; k += 1) {
        if (token !== loadToken.current) return;
        const yaEsta = ventanaRef.current[indiceActual + 1 + k];
        if (yaEsta) continue;
        const r = await resolverUri(querido[k]!.id, archivos, cacheAudio.current);
        if (token !== loadToken.current || !r.ok) return;
        playlist.add({ uri: r.uri });
        ventanaRef.current = [...ventanaRef.current, querido[k]!.id];
        refrescarBloqueo(indiceEsperado.current);
      }
    },
    [playlist, refrescarBloqueo, resolverUri],
  );

  const loadEpisode = useCallback(
    async (target: Episode, reproducir = true) => {
      const token = ++loadToken.current;
      playedSinceLoad.current = false;
      ultimoTerminado.current = null;
      setLoadedId(null);
      setErrorAudio(null);
      setEstadoAudio("cargando");
      try {
        playlist.pause();
      } catch {
        // Sin nada cargado todavía.
      }
      await setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: "doNotMix" }).catch(() => undefined);
      const archivos = await leerDescargas();
      if (token !== loadToken.current) return;
      const pos = posicionEn(colaRef.current, target.id, contextoRef.current.pos ?? 0);
      const plan = planVentana(colaRef.current, pos < 0 ? 0 : pos, grabado, 2);
      // El vecino anterior se resuelve a la vez que el actual; no se espera más de un instante.
      const previoP = plan.anterior ? resolverUri(plan.anterior.id, archivos, cacheAudio.current) : null;
      const actual = await resolverUri(target.id, archivos, cacheAudio.current);
      if (token !== loadToken.current) return;
      if (!actual.ok) {
        fallar(actual.error);
        return;
      }
      const previo = previoP ? await Promise.race([previoP, new Promise<null>((res) => setTimeout(() => res(null), 1200))]) : null;
      if (token !== loadToken.current) return;
      try {
        playlist.clear();
        const ids: string[] = [];
        if (previo && previo.ok && plan.anterior) {
          playlist.add({ uri: previo.uri });
          ids.push(plan.anterior.id);
        }
        playlist.add({ uri: actual.uri });
        ids.push(target.id);
        ventanaRef.current = ids;
        indiceEsperado.current = ids.length - 1;
        cargadoEn.current = Date.now();
        if (ids.length > 1) playlist.skipTo(ids.length - 1);
        playlist.playbackRate = settingsRef.current.rate;
        const resume = resumePosition(progressRef.current.episodes[target.id], target.durationSeconds);
        if (resume > 0) void playlist.seekTo(resume);
        refrescarBloqueo(ids.length - 1);
        setLoadedId(target.id);
        playedSinceLoad.current = true;
        if (reproducir) playlist.play();
        void ampliarVentana(token, pos < 0 ? 0 : pos);
      } catch (error) {
        console.warn("[audio] reproductor", error);
        fallar("reproductor");
      }
    },
    [ampliarVentana, fallar, playlist, refrescarBloqueo, resolverUri],
  );

  const renovarRef = useRef<(reproducir: boolean) => boolean>(() => false);
  const playEpisodeRef = useRef<(id: string) => void>(() => undefined);
  const reproducirEpisodio = useCallback(
    (id: string, opciones: { forzar?: boolean; contexto?: ContextoCola; pos?: number; reproducir?: boolean } = {}) => {
      const target = episodiosPorId.get(id);
      if (!target) return;
      // El contexto: el que se pide, o el actual si el episodio está en su cola, o su libro.
      let ctx = opciones.contexto ?? contextoRef.current;
      let cola = opciones.contexto ? construirCola(opciones.contexto, fuentesCola) : colaRef.current;
      if (!opciones.contexto && !cola.includes(id)) {
        const libro = fuentesCola.rangos.find((r) => r.id === id)?.bookId ?? id.split("-")[0] ?? "gn";
        ctx = { tipo: "libro", id: libro };
        cola = construirCola(ctx, fuentesCola);
      }
      const pos = opciones.pos ?? posicionEn(cola, id, opciones.contexto ? opciones.contexto.pos ?? 0 : contextoRef.current.pos ?? 0);
      fijarContexto({ ...ctx, pos: pos < 0 ? 0 : pos });
      if (!opciones.forzar && target.id === currentIdRef.current && loadedIdRef.current === target.id) {
        if (renovarRef.current(true)) return;
        playlist.play();
        return;
      }
      currentIdRef.current = target.id;
      setCurrentId(target.id);
      setTieneActualGuardado(true);
      void AsyncStorage.setItem(STORAGE_KEYS.current, target.id);
      // En la app escuchar pide cuenta, también lo gratis: sin sesión no se pide audio.
      if (decidirReproduccion({ id: target.id, grabado: true, haySesion: Boolean(sesionRef.current) }) === "cuenta") {
        loadToken.current += 1;
        setLoadedId(null);
        setPendiente(target.id);
        setErrorAudio("entrar");
        setEstadoAudio("error");
        return;
      }
      if (!tieneAudioEn(settingsRef.current.audioLocale)) {
        loadToken.current += 1;
        setLoadedId(null);
        setErrorAudio("idioma");
        setEstadoAudio("error");
        return;
      }
      setEstadoAudio("cargando");
      setErrorAudio(null);
      void loadEpisode(target, opciones.reproducir ?? true);
    },
    [fijarContexto, loadEpisode, playlist, setPendiente],
  );
  playEpisodeRef.current = (id) => reproducirEpisodio(id);

  /** Si la URL firmada ya cargada caduca pronto, recarga el episodio con una nueva (la posición se recupera del avance). */
  renovarRef.current = (reproducir) => {
    const actualId = loadedIdRef.current;
    if (!actualId) return false;
    const ahora = Date.now();
    const ventana = ventanaRef.current;
    const actualCaduca = necesitaRenovar(expirasRef.current.get(actualId), ahora);
    // Sonando solo se interrumpe si la actual está a punto de fallar; en pausa se renueva también la de los vecinos.
    const algunaCaduca = !status.playing && ventana.some((id) => necesitaRenovar(expirasRef.current.get(id), ahora));
    if (!actualCaduca && !algunaCaduca) return false;
    reproducirEpisodio(actualId, { forzar: true, reproducir });
    return true;
  };

  // Al volver de segundo plano o de la pantalla de bloqueo, antes de que el usuario pulse nada.
  useEffect(() => {
    const aviso = AppState.addEventListener("change", (estado) => {
      if (estado === "active") renovarRef.current(statusRef.current.playing);
    });
    return () => aviso.remove();
  }, []);

  /** El audio nativo cambió de pista (siguiente desde la pantalla de bloqueo o fin natural del episodio). */
  const cambioNativo = useCallback(
    (id: string, indice: number, previo: number) => {
      const viejo = ultimaPosicion.current;
      if (viejo.id && viejo.dur > 0 && viejo.t >= viejo.dur - 8) {
        setProgress((current) => {
          const next = recordListen(current, viejo.id, viejo.dur, viejo.dur, "ended", new Date().toISOString());
          void AsyncStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(next));
          progressRef.current = next;
          return next;
        });
      }
      const cola = colaRef.current;
      const desde = contextoRef.current.pos ?? 0;
      let pos = -1;
      if (indice > previo) {
        for (let i = desde + 1; i < cola.length; i += 1) if (cola[i] === id) { pos = i; break; }
      } else {
        for (let i = desde - 1; i >= 0; i -= 1) if (cola[i] === id) { pos = i; break; }
      }
      if (pos < 0) pos = Math.max(posicionEn(cola, id, desde), 0);
      fijarContexto({ ...contextoRef.current, pos });
      currentIdRef.current = id;
      loadedIdRef.current = id;
      setCurrentId(id);
      setLoadedId(id);
      setTieneActualGuardado(true);
      void AsyncStorage.setItem(STORAGE_KEYS.current, id);
      playedSinceLoad.current = true;
      setErrorAudio(null);
      setEstadoAudio("listo");
      refrescarBloqueo(indice);
      void ampliarVentana(loadToken.current, pos);
    },
    [ampliarVentana, fijarContexto, refrescarBloqueo],
  );

  useEffect(() => {
    const ventana = ventanaRef.current;
    if (!loadedIdRef.current || status.trackCount !== ventana.length) return;
    if (Date.now() - cargadoEn.current < 800) return;
    const indice = status.currentIndex;
    if (indice === indiceEsperado.current) return;
    const id = ventana[indice];
    if (!id) return;
    const previo = indiceEsperado.current;
    indiceEsperado.current = indice;
    cambioNativo(id, indice, previo);
  }, [cambioNativo, status.currentIndex, status.trackCount]);

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: "doNotMix",
    });
  }, []);
  const restored = useRef(false);

  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    let active = true;
    void (async () => {
      const [storedSettings, storedProgress, storedPath, storedCurrent, storedCola] = await Promise.all([
        readJson(STORAGE_KEYS.settings),
        readJson(STORAGE_KEYS.progress),
        readJson(STORAGE_KEYS.path),
        AsyncStorage.getItem(STORAGE_KEYS.current),
        readJson(CLAVE_COLA),
      ]);
      if (!active) return;
      const nextSettings = parseSettings(storedSettings);
      if (!nextSettings.localeElegido) {
        const idioma = idiomaDeEtiqueta(getLocales()[0]?.languageTag ?? null);
        if (idioma && esIdiomaInterfaz(idioma)) nextSettings.uiLocale = idioma;
      }
      const rangos = catalog.rangos ?? [];
      const nextProgress = migrarProgreso(parseProgress(storedProgress), rangos);
      const nextPath = sanitizePath(migrarCamino(parsePath(storedPath), rangos), ids, new Date().toISOString());
      const actualGuardado = parseEpisodioActual(storedCurrent, ids, null);
      const actualId = actualGuardado ?? (primero?.id ?? null);
      setTieneActualGuardado(Boolean(actualGuardado));
      progressRef.current = nextProgress;
      settingsRef.current = nextSettings;
      setSettings(nextSettings);
      setProgress(nextProgress);
      setPath(nextPath);
      setCurrentId(actualId);
      const guardada = parseContexto(storedCola, { tipo: "camino", id: nextSettings.caminoActivo || "biblia" });
      contextoRef.current = guardada;
      colaRef.current = construirCola(guardada, fuentesCola);
      setContextoEstado(guardada);
      setHydrated(true);
    })();
    return () => {
      active = false;
    };
  }, [ids, primero]);

  useEffect(() => {
    const remoto = supabaseApp();
    if (!remoto) return;
    const aSesion = (datos: { user: { id: string; email?: string | null } } | null): Sesion | null =>
      datos ? { userId: datos.user.id, email: datos.user.email ?? null, proveedor: "correo" } : null;
    let vivo = true;
    void remoto.auth.getSession().then(({ data }) => {
      if (vivo) setSesion(aSesion(data.session));
    });
    const { data: suscripcion } = remoto.auth.onAuthStateChange((_evento, datos) => setSesion(aSesion(datos)));
    void AsyncStorage.getItem(CLAVE_PENDIENTE).then((id) => {
      if (vivo && id) setPendienteEstado(id);
    });
    return () => {
      vivo = false;
      suscripcion.subscription.unsubscribe();
    };
  }, []);

  const cargado = Boolean(episode) && loadedId === episode?.id;
  // Cada episodio tiene un solo segmento; el índice de la lista nativa es el de la ventana, no el del segmento.
  const index = 0;
  const globalTime = episode && cargado ? (episode.segments[index]?.startSeconds ?? 0) + status.currentTime : episode ? resumePosition(progress.episodes[episode.id], episode.durationSeconds) : 0;
  const wholeSecond = Math.floor(globalTime);
  if (episode && cargado) ultimaPosicion.current = { id: episode.id, t: globalTime, dur: episode.durationSeconds };

  useEffect(() => {
    if (status.playing) playedSinceLoad.current = true;
  }, [status.playing]);

  useEffect(() => {
    if (!hydrated || !episode || !cargado || !playedSinceLoad.current) return;
    const completed = !status.playing && status.didJustFinish && index === episode.segments.length - 1;
    setProgress((current) => {
      const next = recordListen(
        current,
        episode.id,
        globalTime,
        episode.durationSeconds,
        completed ? "ended" : status.playing ? "playing" : "paused",
        new Date().toISOString(),
      );
      void AsyncStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(next));
      return next;
    });
    // Persist about once a second. globalTime is read from the render that crossed that second.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, cargado, episode?.id, index, status.didJustFinish, status.playing, wholeSecond]);

  useEffect(() => {
    if (estadoAudio !== "cargando" || loadedId !== episode?.id) return;
    if (status.playing) setEstadoAudio("listo");
  }, [estadoAudio, loadedId, episode?.id, status.playing]);

  useEffect(() => {
    if (estadoAudio !== "cargando") return;
    const espera = setTimeout(() => fallar("reproductor"), 15000);
    return () => clearTimeout(espera);
  }, [estadoAudio, fallar, currentId]);

  // Si al terminar no hay siguiente en la lista nativa (no se pudo preparar), se intenta cargar el siguiente de la cola.
  useEffect(() => {
    if (!episode || !cargado || !status.didJustFinish || status.playing) return;
    if (status.currentIndex < ventanaRef.current.length - 1 || ultimoTerminado.current === episode.id) return;
    ultimoTerminado.current = episode.id;
    const v = vecino(colaRef.current, contextoRef.current.pos ?? 0, 1, grabado);
    if (!v) return;
    if (decidirReproduccion({ id: v.id, grabado: true, haySesion: Boolean(sesionRef.current) }) !== "play") return;
    reproducirEpisodio(v.id, { pos: v.pos });
  }, [cargado, episode, reproducirEpisodio, status.currentIndex, status.didJustFinish, status.playing]);

  const updateSettings = (patch: Partial<Settings>) => {
    setSettings((current) => {
      const next = { ...current, ...patch };
      void AsyncStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(next));
      return next;
    });
  };

  const writePath = (next: ListeningPath) => {
    setPath(next);
    void AsyncStorage.setItem(STORAGE_KEYS.path, JSON.stringify(next));
  };

  useEffect(() => {
    if (!sleepUntil) return;
    const timer = setInterval(() => {
      const now = Date.now();
      setClock(now);
      if (sleepHasElapsed(sleepUntil, now)) {
        playlist.pause();
        setSleepUntil(null);
      }
    }, 500);
    return () => clearInterval(timer);
  }, [playlist, sleepUntil]);

  useEffect(() => {
    if (!hydrated || !status.playing) return;
    setProgress((current) => {
      const listenedOn = recordListeningDay(current.listenedOn ?? [], localIsoDate(new Date()));
      if (listenedOn === current.listenedOn) return current;
      const next = { ...current, listenedOn };
      void AsyncStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(next));
      return next;
    });
  }, [hydrated, status.playing]);

  const seekGlobal = useCallback(
    (seconds: number) => {
      if (!episode) return;
      void playlist.seekTo(Math.min(Math.max(seconds, 0), episode.durationSeconds));
    },
    [playlist, episode],
  );

  const siguienteCola = useCallback(() => {
    const v = vecino(colaRef.current, contextoRef.current.pos ?? 0, 1, grabado);
    if (!v) return;
    const ventana = ventanaRef.current;
    if (loadedIdRef.current && ventana[status.currentIndex + 1] === v.id) {
      playlist.next();
      playlist.play();
      return;
    }
    reproducirEpisodio(v.id, { pos: v.pos, forzar: true });
  }, [playlist, reproducirEpisodio, status.currentIndex]);

  const anteriorCola = useCallback(() => {
    // Como en un reproductor de música: pasados unos segundos, «anterior» vuelve al principio.
    if (loadedIdRef.current && status.currentTime > 3) {
      void playlist.seekTo(0);
      return;
    }
    const v = vecino(colaRef.current, contextoRef.current.pos ?? 0, -1, grabado);
    if (!v) {
      void playlist.seekTo(0);
      return;
    }
    const ventana = ventanaRef.current;
    if (loadedIdRef.current && ventana[status.currentIndex - 1] === v.id) {
      playlist.previous();
      return;
    }
    reproducirEpisodio(v.id, { pos: v.pos, forzar: true });
  }, [playlist, reproducirEpisodio, status.currentIndex, status.currentTime]);

  const value: MobileLibrary = {
    catalog,
    settings,
    progress,
    path,
    hydrated,
    daily: dailyListening({
      path,
      progress,
      playableIds: ids,
      durations: Object.fromEntries(reproducibles.map((item) => [item.id, item.durationSeconds])),
      plannedMinutes: settings.dailyMinutes,
    }),
    globalTime,
    playing: status.playing,
    updateSettings,
    addEpisode: (id) => writePath(addToPath(path, id, ids, new Date().toISOString()).path),
    removeEpisode: (id) => writePath(removeFromPath(path, id, new Date().toISOString()).path),
    sesion,
    pendiente,
    setPendiente,
    currentEpisode: episode,
    cargadoId: loadedId,
    tieneActualGuardado,
    estadoAudio,
    errorAudio,
    contexto,
    colaIds,
    posCola,
    siguiente: siguienteCola,
    anterior: anteriorCola,
    irAPos: (pos) => {
      const id = colaRef.current[pos];
      if (id) reproducirEpisodio(id, { pos });
    },
    playEpisode: (id, opciones) => reproducirEpisodio(id, opciones),
    reintentar: () => {
      if (episode) reproducirEpisodio(episode.id, { forzar: true });
    },
    toggle: () => {
      if (!episode) return;
      if (!cargado) {
        reproducirEpisodio(episode.id, { forzar: true });
        return;
      }
      if (status.playing) playlist.pause();
      else if (!renovarRef.current(true)) playlist.play();
    },
    seekBy: (delta) => seekGlobal(globalTime + delta),
    seek: (seconds) => seekGlobal(seconds),
    restart: () => seekGlobal(0),
    setRate: (rate) => {
      playlist.playbackRate = rate;
      updateSettings({ rate });
    },
    setSleep: (minutes) => setSleepUntil(minutes ? sleepDeadline(minutes, Date.now()) : null),
    sleepLabel: formatSleepRemaining(sleepUntil == null ? null : Math.max(0, sleepUntil - clock)),
  };

  return <MobileContext.Provider value={value}>{children}</MobileContext.Provider>;
}
