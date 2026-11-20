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
  type Settings,
  type SleepMinutes,
} from "@audite/domain";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";
import { parseEpisodioActual } from "./actual";
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
  /** Carga el episodio y lo reproduce. Si ya es el actual, solo reanuda. */
  playEpisode: (id: string) => void;
  toggle: () => void;
  seekBy: (delta: number) => void;
  restart: () => void;
  setRate: (rate: PlaybackRate) => void;
  setSleep: (minutes: SleepMinutes | null) => void;
  sleepLabel: string | null;
};

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
  const sources = useMemo(
    () => (primero ? primero.segments.map((segment) => ({ uri: `${contentBase}${segment.publicPath}` })) : []),
    [],
  );
  const playlist = useAudioPlaylist({ sources, loop: "none", updateInterval: 250 });
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
  const ids = useMemo(() => playableIds(catalog), []);
  const episode = (currentId ? episodiosPorId.get(currentId) : null) ?? primero;
  const progressRef = useRef(progress);
  progressRef.current = progress;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const loadToken = useRef(0);
  /** Hasta que no suena, la posición del reproductor puede ser la del episodio anterior. */
  const playedSinceLoad = useRef(false);

  const loadEpisode = useCallback(
    async (target: Episode, play: boolean) => {
      const token = ++loadToken.current;
      playedSinceLoad.current = false;
      setLoadedId(null);
      try {
        playlist.pause();
      } catch {
        // Sin nada cargado todavía.
      }
      const archivos = await leerDescargas();
      if (token !== loadToken.current) return;
      const fuentes = urisDeReproduccion(
        target.id,
        target.segments.map((segment) => ({
          id: segment.id,
          // TODO: el audio remoto vive en /api/audio/{id}. Hay que pedirlo con Authorization: Bearer <access_token> y usar la URL firmada. Mientras, no se rompe: esa ruta no se trata como archivo local.
          remoto: segment.publicPath.startsWith("/api/audio/") ? segment.publicPath : `${contentBase}${segment.publicPath}`,
        })),
        archivos,
      );
      const uris = fuentes.origen === "local" ? fuentes.uris : target.segments.map((segment) => `${contentBase}${segment.publicPath}`);
      playlist.clear();
      for (const uri of uris) playlist.add({ uri });
      playlist.playbackRate = settingsRef.current.rate;
      const resume = resumePosition(progressRef.current.episodes[target.id], target.durationSeconds);
      const resolved = segmentAt(
        target.segments.map((segment) => ({
          id: segment.id,
          url: segment.publicPath,
          startSeconds: segment.startSeconds,
          durationSeconds: segment.durationSeconds,
        })),
        resume,
      );
      if (resolved) {
        const index = target.segments.findIndex((segment) => segment.id === resolved.segment.id);
        if (index > 0) playlist.skipTo(index);
        if (resolved.localSeconds > 0) void playlist.seekTo(resolved.localSeconds);
      }
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
      if (play) {
        playedSinceLoad.current = true;
        playlist.play();
      }
    },
    [playlist],
  );

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
      const target = actualId ? episodiosPorId.get(actualId) : null;
      if (target) await loadEpisode(target, false);
      if (active) setHydrated(true);
    })();
    return () => {
      active = false;
    };
  }, [ids, loadEpisode, primero]);

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
    currentEpisode: episode,
    playEpisode: (id) => {
      const target = episodiosPorId.get(id);
      if (!target) return;
      if (target.id === episode?.id && loadedId === target.id) {
        playlist.play();
        return;
      }
      setCurrentId(target.id);
      void AsyncStorage.setItem(STORAGE_KEYS.current, target.id);
      void loadEpisode(target, true);
    },
    toggle: () => {
      if (!episode || !cargado) return;
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
