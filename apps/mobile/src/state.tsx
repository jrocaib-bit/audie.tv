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
  idiomaDeEtiqueta,
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
import { decidirReproduccion } from "./acceso";
import { crearCacheAudio, resolverAudio, type ErrorAudio } from "./audio-url";
import { supabaseApp, tokenAcceso } from "./auth";
import { caminoPorId, idsDeCamino, progresoCamino } from "./caminos";
import { leerDescargas } from "./descargas";
import { obraDeEpisodio, obraWebp } from "../../../packages/content/src/obras-visibles";
import { baseDeContenido, uriDeObra } from "./entorno";
import { setAudioModeAsync, useAudioPlaylist, useAudioPlaylistStatus } from "expo-audio";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
const contentBase = baseDeContenido();

const indice = indiceJson as AppCatalog;
const genesis = genesisJson as { episodios: AppCatalog["pendientes"] };
export const catalog: AppCatalog = { ...indice, pendientes: genesis.episodios, rangos: indice.rangos ?? [] };

const reproducibles = playableEpisodes(catalog);
const episodiosPorId = new Map(reproducibles.map((item) => [item.id, item]));

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
  /** Sesión de la cuenta (null si no se ha entrado). */
  sesion: Sesion | null;
  /** Episodio que se quiso escuchar sin cuenta; arranca solo al entrar. */
  pendiente: string | null;
  setPendiente: (id: string | null) => void;
  /** Estado de la carga del audio del episodio actual. */
  estadoAudio: "inactivo" | "cargando" | "listo" | "error";
  errorAudio: ErrorAudio | null;
  /** Carga el episodio y lo reproduce. Si ya es el actual, solo reanuda. */
  playEpisode: (id: string) => void;
  /** Vuelve a pedir el audio del episodio actual. */
  reintentar: () => void;
  toggle: () => void;
  seekBy: (delta: number) => void;
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
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [progress, setProgress] = useState<ProgressState>(emptyProgress);
  const [path, setPath] = useState<ListeningPath>(emptyPath);
  const [hydrated, setHydrated] = useState(false);
  const [sleepUntil, setSleepUntil] = useState<number | null>(null);
  const [clock, setClock] = useState(() => Date.now());
  const [currentId, setCurrentId] = useState<string | null>(primero?.id ?? null);
  /** Episodio cuyo audio está de verdad en la lista de reproducción. */
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [estadoAudio, setEstadoAudio] = useState<"inactivo" | "cargando" | "listo" | "error">("inactivo");
  const [errorAudio, setErrorAudio] = useState<ErrorAudio | null>(null);
  const cacheAudio = useRef(crearCacheAudio());
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

  const loadEpisode = useCallback(
    async (target: Episode) => {
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
      const local = urisDeReproduccion(
        target.id,
        target.segments.map((segment) => ({ id: segment.id, remoto: `${contentBase}${segment.publicPath}` })),
        archivos,
      );
      let uris: string[];
      if (local.origen === "local") {
        uris = local.uris;
      } else {
        const acceso = await tokenAcceso();
        const resultado = await resolverAudio(target.id, {
          base: contentBase,
          token: acceso,
          fetch: (url, init) => fetch(url, init),
          cache: cacheAudio.current,
        });
        if (token !== loadToken.current) return;
        if (!resultado.ok) {
          fallar(resultado.error);
          return;
        }
        uris = [resultado.url];
      }
      try {
        playlist.clear();
        for (const uri of uris) playlist.add({ uri });
        playlist.playbackRate = settingsRef.current.rate;
        const resume = resumePosition(progressRef.current.episodes[target.id], target.durationSeconds);
        if (resume > 0) void playlist.seekTo(resume);
        const obra = obraDeEpisodio(target.id);
        playlist.setActiveForLockScreen(
          true,
          {
            title: target.tituloCorto?.es || target.title,
            artist: "Audite",
            albumTitle: target.scriptureRangeLabel,
            artworkUrl: obra ? uriDeObra(obraWebp(obra)) : undefined,
          },
          { showSeekBackward: true, showSeekForward: true, seekBackwardIntervalSeconds: 15, seekForwardIntervalSeconds: 15 },
        );
        setLoadedId(target.id);
        playedSinceLoad.current = true;
        playlist.play();
      } catch (error) {
        console.warn("[audio] reproductor", error);
        fallar("reproductor");
      }
    },
    [fallar, playlist],
  );

  const playEpisodeRef = useRef<(id: string) => void>(() => undefined);
  const reproducirEpisodio = useCallback(
    (id: string, forzar = false) => {
      const target = episodiosPorId.get(id);
      if (!target) return;
      if (!forzar && target.id === currentIdRef.current && loadedIdRef.current === target.id) {
        playlist.play();
        return;
      }
      currentIdRef.current = target.id;
      setCurrentId(target.id);
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
      setEstadoAudio("cargando");
      setErrorAudio(null);
      void loadEpisode(target);
    },
    [loadEpisode, playlist],
  );
  playEpisodeRef.current = (id) => reproducirEpisodio(id);

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
      const [storedSettings, storedProgress, storedPath, storedCurrent] = await Promise.all([
        readJson(STORAGE_KEYS.settings),
        readJson(STORAGE_KEYS.progress),
        readJson(STORAGE_KEYS.path),
        AsyncStorage.getItem(STORAGE_KEYS.current),
      ]);
      if (!active) return;
      const nextSettings = parseSettings(storedSettings);
      if (!nextSettings.localeElegido) {
        const idioma = idiomaDeEtiqueta(getLocales()[0]?.languageTag ?? null);
        if (idioma) nextSettings.uiLocale = idioma;
      }
      const rangos = catalog.rangos ?? [];
      const nextProgress = migrarProgreso(parseProgress(storedProgress), rangos);
      const nextPath = sanitizePath(migrarCamino(parsePath(storedPath), rangos), ids, new Date().toISOString());
      const actualId = parseEpisodioActual(storedCurrent, ids, primero?.id ?? null);
      progressRef.current = nextProgress;
      settingsRef.current = nextSettings;
      setSettings(nextSettings);
      setProgress(nextProgress);
      setPath(nextPath);
      setCurrentId(actualId);
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
  const index = episode ? Math.min(status.currentIndex, Math.max(episode.segments.length - 1, 0)) : 0;
  const globalTime = episode && cargado ? (episode.segments[index]?.startSeconds ?? 0) + status.currentTime : episode ? resumePosition(progress.episodes[episode.id], episode.durationSeconds) : 0;
  const wholeSecond = Math.floor(globalTime);

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

  useEffect(() => {
    if (!episode || !cargado || !status.didJustFinish || status.playing) return;
    if (index !== episode.segments.length - 1 || ultimoTerminado.current === episode.id) return;
    ultimoTerminado.current = episode.id;
    const def = caminoPorId(settingsRef.current.caminoActivo, catalog.rangos);
    const hechos = { ...progressRef.current.episodes, [episode.id]: { positionSeconds: episode.durationSeconds, updatedAt: "", completed: true } };
    const siguiente = progresoCamino(idsDeCamino(def, catalog.rangos), { episodes: hechos }).siguiente;
    if (!siguiente || siguiente === episode.id || !episodiosPorId.has(siguiente)) return;
    if (decidirReproduccion({ id: siguiente, grabado: true, haySesion: Boolean(sesionRef.current) }) !== "play") return;
    playEpisodeRef.current(siguiente);
  }, [cargado, episode, index, status.didJustFinish, status.playing]);

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
      const resolved = segmentAt(
        episode.segments.map((segment) => ({
          id: segment.id,
          url: segment.publicPath,
          startSeconds: segment.startSeconds,
          durationSeconds: segment.durationSeconds,
        })),
        seconds,
      );
      if (!resolved) return;
      const nextIndex = episode.segments.findIndex((segment) => segment.id === resolved.segment.id);
      if (nextIndex !== status.currentIndex) playlist.skipTo(Math.max(0, nextIndex));
      void playlist.seekTo(resolved.localSeconds);
    },
    [playlist, status.currentIndex, episode],
  );

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
    estadoAudio,
    errorAudio,
    playEpisode: (id) => reproducirEpisodio(id),
    reintentar: () => {
      if (episode) reproducirEpisodio(episode.id, true);
    },
    toggle: () => {
      if (!episode) return;
      if (!cargado) {
        reproducirEpisodio(episode.id, true);
        return;
      }
      if (status.playing) playlist.pause();
      else playlist.play();
    },
    seekBy: (delta) => seekGlobal(globalTime + delta),
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
