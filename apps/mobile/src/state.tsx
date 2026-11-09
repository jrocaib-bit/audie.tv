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
  playableIds,
  recordListen,
  removeFromPath,
  resumePosition,
  sanitizePath,
  segmentAt,
  type AppCatalog,
  type DailyPlan,
  type ListeningPath,
  type PlaybackRate,
  type ProgressState,
  type Settings,
  type SleepMinutes,
} from "@audite/domain";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setAudioModeAsync, useAudioPlaylist, useAudioPlaylistStatus } from "expo-audio";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
const contentBase = process.env.EXPO_PUBLIC_CONTENT_BASE ?? "http://127.0.0.1:43123";

const indice = indiceJson as AppCatalog;
const genesis = genesisJson as { episodios: AppCatalog["pendientes"] };
export const catalog: AppCatalog = { ...indice, pendientes: genesis.episodios, rangos: indice.rangos ?? [] };

const episode = catalog.episodes[0] ?? null;

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
  const sources = useMemo(
    () => (episode ? episode.segments.map((segment) => ({ uri: `${contentBase}${segment.publicPath}` })) : []),
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
  const ids = useMemo(() => playableIds(catalog), []);

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: "doNotMix",
    });
    if (!episode) return;
    const artwork = catalog.artworks[0];
    const source = artwork ? { uri: `${contentBase}${artwork.publicPath}` } : null;
    playlist.setActiveForLockScreen(true, {
      title: episode.title,
      artist: "audˈte",
      albumTitle: episode.scriptureRangeLabel,
      artworkUrl: source?.uri,
    });
  }, [playlist]);
  const restored = useRef(false);

  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    let active = true;
    void (async () => {
      const [storedSettings, storedProgress, storedPath] = await Promise.all([
        readJson(STORAGE_KEYS.settings),
        readJson(STORAGE_KEYS.progress),
        readJson(STORAGE_KEYS.path),
      ]);
      if (!active) return;
      const nextSettings = parseSettings(storedSettings);
      const rangos = catalog.rangos ?? [];
      const nextProgress = migrarProgreso(parseProgress(storedProgress), rangos);
      const nextPath = sanitizePath(migrarCamino(parsePath(storedPath), rangos), ids, new Date().toISOString());
      setSettings(nextSettings);
      setProgress(nextProgress);
      setPath(nextPath);
      playlist.playbackRate = nextSettings.rate;
      if (!episode) {
        setHydrated(true);
        return;
      }
      const resume = resumePosition(nextProgress.episodes[episode.id], episode.durationSeconds);
      const resolved = segmentAt(
        episode.segments.map((segment) => ({
          id: segment.id,
          url: segment.publicPath,
          startSeconds: segment.startSeconds,
          durationSeconds: segment.durationSeconds,
        })),
        resume,
      );
      if (resolved) {
        const index = episode.segments.findIndex((segment) => segment.id === resolved.segment.id);
        if (index > 0) playlist.skipTo(index);
        void playlist.seekTo(resolved.localSeconds);
      }
      setHydrated(true);
    })();
    return () => {
      active = false;
    };
  }, [ids, playlist]);

  const index = episode ? Math.min(status.currentIndex, Math.max(episode.segments.length - 1, 0)) : 0;
  const globalTime = episode ? (episode.segments[index]?.startSeconds ?? 0) + status.currentTime : 0;
  const wholeSecond = Math.floor(globalTime);

  useEffect(() => {
    if (!hydrated || !episode) return;
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
  }, [hydrated, index, status.didJustFinish, status.playing, wholeSecond]);

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
    [playlist, status.currentIndex],
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
      durations: episode ? { [episode.id]: episode.durationSeconds } : {},
      plannedMinutes: settings.dailyMinutes,
    }),
    globalTime,
    playing: status.playing,
    updateSettings,
    addEpisode: (id) => writePath(addToPath(path, id, ids, new Date().toISOString()).path),
    removeEpisode: (id) => writePath(removeFromPath(path, id, new Date().toISOString()).path),
    toggle: () => {
      if (!episode) return;
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
