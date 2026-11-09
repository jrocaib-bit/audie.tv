"use client";

import {
  JoinedPlayback,
  STORAGE_KEYS,
  addToPath,
  dailyListening,
  defaultSettings,
  emptyPath,
  emptyProgress,
  episodeById,
  initialPlayerState,
  moveStep,
  parsePath,
  migrarCamino,
  migrarProgreso,
  parseProgress,
  parseSettings,
  playableIds,
  playerReducer,
  recordListen,
  removeFromPath,
  resumePosition,
  sanitizePath,
  type AudioPort,
  type AppCatalog,
  type DailyPlan,
  type ListeningPath,
  artworkById,
  frameAt,
  localIsoDate,
  recordListeningDay,
  sleepDeadline,
  sleepHasElapsed,
  sleepRemainingMs,
  type PlaybackRate,
  type PlayerState,
  type ProgressState,
  type Settings,
  type SleepMinutes,
} from "@audite/domain";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

type LibraryValue = {
  catalog: AppCatalog;
  settings: Settings;
  progress: ProgressState;
  path: ListeningPath;
  player: PlayerState;
  hydrated: boolean;
  reduceMotion: boolean;
  updateSettings: (patch: Partial<Settings>) => void;
  addEpisode: (id: string) => void;
  removeEpisode: (id: string) => void;
  moveEpisode: (index: number, direction: -1 | 1) => void;
  loadEpisode: (id: string) => void;
  playEpisode: (id: string, fromStart?: boolean) => void;
  toggle: () => void;
  seek: (seconds: number) => void;
  seekBy: (delta: number) => void;
  setRate: (rate: PlaybackRate) => void;
  setDragging: (dragging: boolean) => void;
  setSleep: (minutes: SleepMinutes | null) => void;
  sleepRemainingMs: number | null;
  daily: DailyPlan;
};

const LibraryContext = createContext<LibraryValue | null>(null);

export function useLibrary(): LibraryValue {
  const value = useContext(LibraryContext);
  if (!value) throw new Error("useLibrary must be used inside LibraryProvider");
  return value;
}

function readStored(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as unknown) : null;
  } catch {
    return null;
  }
}

function wrap(element: HTMLAudioElement): AudioPort {
  let token = 0;
  return {
    get src() {
      return element.dataset.assignedSrc ?? "";
    },
    set src(value: string) {
      if (element.dataset.assignedSrc === value) return;
      element.dataset.assignedSrc = value;
      element.src = value;
    },
    get currentTime() {
      return Number.isFinite(element.currentTime) ? element.currentTime : 0;
    },
    set currentTime(value: number) {
      const mark = ++token;
      const apply = () => {
        if (mark !== token) return;
        try {
          element.currentTime = value;
        } catch {
          /* The browser applies this once metadata arrives. */
        }
      };
      if (element.readyState >= 1) apply();
      else element.addEventListener("loadedmetadata", apply, { once: true });
    },
    get playbackRate() {
      return element.playbackRate;
    },
    set playbackRate(value: number) {
      element.playbackRate = value;
      element.preservesPitch = true;
    },
    get paused() {
      return element.paused;
    },
    set paused(_value: boolean) {},
    get preload() {
      return element.preload;
    },
    set preload(value: string) {
      element.preload = value as HTMLMediaElement["preload"];
    },
    play: () => element.play(),
    pause: () => element.pause(),
  };
}

export function LibraryProvider({ catalog, children }: { catalog: AppCatalog; children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [progress, setProgress] = useState<ProgressState>(emptyProgress);
  const [path, setPath] = useState<ListeningPath>(emptyPath);
  const [player, setPlayer] = useState<PlayerState>(initialPlayerState);
  const [hydrated, setHydrated] = useState(false);
  const [sleepUntil, setSleepUntil] = useState<number | null>(null);
  const [clock, setClock] = useState(() => Date.now());
  const [systemReduce, setSystemReduce] = useState(false);
  const [ports, setPorts] = useState<[HTMLAudioElement | null, HTMLAudioElement | null]>([null, null]);
  const engineRef = useRef<JoinedPlayback | null>(null);
  const audioRefs = useRef<[HTMLAudioElement | null, HTMLAudioElement | null]>([null, null]);
  const playerRef = useRef(player);
  const progressRef = useRef(progress);
  const dragging = useRef(false);
  const pending = useRef<{ id: string; fromStart: boolean; autoplay: boolean } | null>(null);
  const lastSaved = useRef("");
  const ids = useMemo(() => playableIds(catalog), [catalog]);

  useEffect(() => {
    playerRef.current = player;
    progressRef.current = progress;
  });

  const rememberFirst = useCallback((element: HTMLAudioElement | null) => {
    setPorts((current) => (current[0] === element ? current : [element, current[1]]));
  }, []);
  const rememberSecond = useCallback((element: HTMLAudioElement | null) => {
    setPorts((current) => (current[1] === element ? current : [current[0], element]));
  }, []);

  const persistProgress = useCallback((state: PlayerState) => {
    if (!state.episodeId) return;
    const next = recordListen(
      progressRef.current,
      state.episodeId,
      state.globalTime,
      state.duration,
      state.status,
      new Date().toISOString(),
    );
    const comparable = JSON.stringify({ ...next, episodes: { ...next.episodes, [state.episodeId]: { ...next.episodes[state.episodeId], updatedAt: "" } } });
    if (comparable === lastSaved.current) return;
    lastSaved.current = comparable;
    progressRef.current = next;
    setProgress(next);
    localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(next));
  }, []);

  const reportError = useCallback((error: unknown) => {
    if (error instanceof DOMException && error.name === "NotAllowedError") {
      setPlayer((current) => (current.status === "playing" ? { ...current, status: "paused" } : current));
      return;
    }
    setPlayer((current) => playerReducer(current, { type: "error", message: "audio" }));
  }, []);

  const configure = useCallback(
    (episodeId: string, fromStart: boolean) => {
      const episode = episodeById(catalog, episodeId);
      const engine = engineRef.current;
      if (!episode || !engine) return false;
      const resume = fromStart ? 0 : resumePosition(progressRef.current.episodes[episodeId], episode.durationSeconds);
      const rate = playerRef.current.rate;
      engine.configure(
        episode.segments.map((segment) => ({
          id: segment.id,
          url: segment.publicPath,
          startSeconds: segment.startSeconds,
          durationSeconds: segment.durationSeconds,
        })),
        resume,
        rate,
      );
      setPlayer((current) =>
        playerReducer(current, {
          type: "load",
          episodeId,
          duration: episode.durationSeconds,
          globalTime: resume,
          rate,
        }),
      );
      return true;
    },
    [catalog],
  );

  const playWhenReady = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const element = audioRefs.current[engine.activePortIndex()];
    const start = () => {
      void engine
        .play()
        .then(() => setPlayer((current) => playerReducer(current, { type: "play" })))
        .catch(reportError);
    };
    if (!element || element.readyState >= 1) start();
    else element.addEventListener("canplay", start, { once: true });
  }, [reportError]);

  const loadEpisode = useCallback(
    (id: string) => {
      if (!engineRef.current) {
        pending.current = { id, fromStart: false, autoplay: false };
        return;
      }
      const current = playerRef.current;
      if (current.episodeId === id && current.status !== "idle" && current.status !== "error") return;
      configure(id, false);
    },
    [configure],
  );

  const playEpisode = useCallback(
    (id: string, fromStart = false) => {
      if (!engineRef.current) {
        pending.current = { id, fromStart, autoplay: true };
        return;
      }
      const current = playerRef.current;
      const same = current.episodeId === id && !fromStart && current.status !== "error" && current.status !== "idle";
      if (!same) configure(id, fromStart);
      else if (current.status === "ended") engineRef.current.seek(0, false);
      playWhenReady();
    },
    [configure, playWhenReady],
  );

  useEffect(() => {
    let cancelado = false;
    const nextSettings = parseSettings(readStored(STORAGE_KEYS.settings));
    const guardado = parseProgress(readStored(STORAGE_KEYS.progress));
    const camino = parsePath(readStored(STORAGE_KEYS.path));
    void (async () => {
      let rangos = catalog.rangos ?? [];
      if ((guardado.revision ?? 1) < 2 && rangos.length === 0) {
        const respuesta = await fetch("/api/rangos");
        if (respuesta.ok) rangos = ((await respuesta.json()) as { rangos?: typeof rangos }).rangos ?? [];
      }
      if (cancelado) return;
      const nextProgress = migrarProgreso(guardado, rangos);
      const nextPath = sanitizePath(migrarCamino(camino, rangos), ids, new Date().toISOString());
      setSettings(nextSettings);
      setProgress(nextProgress);
      setPath(nextPath);
      setPlayer((current) => ({ ...current, rate: nextSettings.rate }));
      setHydrated(true);
    })();
    return () => {
      cancelado = true;
    };
    // Browser storage is unavailable during SSR. Reading it after mount is the source of truth.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- migrate once from this catalog's ids
  }, [ids]);

  useEffect(() => {
    audioRefs.current = ports;
    const [first, second] = ports;
    if (!first || !second) return;
    engineRef.current = new JoinedPlayback([wrap(first), wrap(second)]);
    const job = pending.current;
    if (!job) return;
    pending.current = null;
    if (job.autoplay) playEpisode(job.id, job.fromStart);
    else loadEpisode(job.id);
  }, [ports, loadEpisode, playEpisode]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setSystemReduce(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const dark =
      settings.theme === "dark" ||
      (settings.theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.dataset.text = settings.textScale;
    document.documentElement.dataset.reduceMotion = settings.reduceMotion || systemReduce ? "true" : "false";
    document.documentElement.lang = settings.uiLocale;
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
  }, [settings, hydrated, systemReduce]);

  useEffect(() => {
    if (settings.theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      document.documentElement.dataset.theme = media.matches ? "dark" : "light";
      document.documentElement.classList.toggle("dark", media.matches);
    };
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [settings.theme]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEYS.path, JSON.stringify(path));
  }, [path, hydrated]);

  useEffect(() => {
    if (player.status !== "playing") return;
    let frame = 0;
    let last = 0;
    const loop = (now: number) => {
      if (!dragging.current && now - last > 160) {
        last = now;
        const time = engineRef.current?.currentGlobal();
        if (time != null) setPlayer((state) => playerReducer(state, { type: "tick", globalTime: time }));
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [player.status]);

  useEffect(() => {
    if (!hydrated || player.status === "idle") return;
    if (player.status === "paused" || player.status === "ended" || player.status === "error") {
      persistProgress(playerRef.current);
    }
  }, [hydrated, persistProgress, player.status]);

  useEffect(() => {
    if (!hydrated) return;
    const save = () => {
      const state = playerRef.current;
      if (state.status === "playing") {
        const today = localIsoDate(new Date());
        setProgress((current) => {
          const listenedOn = recordListeningDay(current.listenedOn ?? [], today);
          if (listenedOn === current.listenedOn) return current;
          const next = { ...current, listenedOn };
          progressRef.current = next;
          localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(next));
          return next;
        });
      }
      persistProgress(state);
    };
    const timer = window.setInterval(save, 2000);
    window.addEventListener("pagehide", save);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("pagehide", save);
    };
  }, [hydrated, persistProgress]);

  const toggle = useCallback(() => {
    const current = playerRef.current;
    if (!current.episodeId || !engineRef.current) return;
    if (current.status === "playing") {
      engineRef.current.pause();
      setPlayer((state) => playerReducer(state, { type: "pause" }));
      return;
    }
    if (current.status === "ended") engineRef.current.seek(0, false);
    playWhenReady();
  }, [playWhenReady]);

  const seek = useCallback(
    (seconds: number) => {
      const engine = engineRef.current;
      if (!engine || !playerRef.current.episodeId) return;
      const playing = playerRef.current.status === "playing";
      const next = engine.seek(seconds, playing);
      const state = playerReducer(playerRef.current, { type: "seek", globalTime: next });
      playerRef.current = state;
      setPlayer(state);
      persistProgress(state);
    },
    [persistProgress],
  );

  const seekBy = useCallback(
    (delta: number) => {
      const duration = playerRef.current.duration;
      const next = Math.min(duration || 0, Math.max(0, playerRef.current.globalTime + delta));
      seek(next);
    },
    [seek],
  );

  const setRate = useCallback((rate: PlaybackRate) => {
    engineRef.current?.setRate(rate);
    setPlayer((state) => playerReducer(state, { type: "set-rate", rate }));
    setSettings((state) => ({ ...state, rate }));
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target?.isContentEditable) return;
      if (event.key === " " || event.key === "k") {
        event.preventDefault();
        toggle();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        seekBy(15);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        seekBy(-15);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [seekBy, toggle]);

  const onEnded = (index: 0 | 1) => {
    const result = engineRef.current?.handleEnded(index);
    if (!result || result.kind === "ignored") return;
    if (result.kind === "advanced") {
      setPlayer((state) => playerReducer(state, { type: "tick", globalTime: result.global }));
      return;
    }
    setPlayer((state) => playerReducer(state, { type: "ended" }));
  };

  useEffect(() => {
    if (!sleepUntil) return;
    const timer = window.setInterval(() => {
      const now = Date.now();
      setClock(now);
      if (sleepHasElapsed(sleepUntil, now)) {
        engineRef.current?.pause();
        setPlayer((state) => playerReducer(state, { type: "pause" }));
        setSleepUntil(null);
      }
    }, 500);
    return () => window.clearInterval(timer);
  }, [sleepUntil]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const episode = catalog.episodes.find((item) => item.id === player.episodeId);
    if (!episode) {
      navigator.mediaSession.metadata = null;
      return;
    }
    const frame = frameAt(catalog.cues, catalog.captions, player.globalTime, true);
    const artwork = artworkById(catalog, frame.artworkId);
    const origin = window.location.origin;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: episode.title,
      artist: "audˈte",
      album: episode.scriptureRangeLabel,
      artwork: artwork
        ? [{ src: `${origin}${artwork.publicPath}`, sizes: `${artwork.width}x${artwork.height}`, type: "image/jpeg" }]
        : [],
    });
    navigator.mediaSession.playbackState = player.status === "playing" ? "playing" : "paused";
    const actions: Array<[MediaSessionAction, () => void]> = [
      ["play", () => playEpisode(episode.id)],
      ["pause", () => toggle()],
      ["seekbackward", () => seekBy(-15)],
      ["seekforward", () => seekBy(15)],
    ];
    for (const [action, handler] of actions) {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {
        /* This browser does not expose that media action. */
      }
    }
    if ("setPositionState" in navigator.mediaSession && player.duration > 0) {
      try {
        navigator.mediaSession.setPositionState({
          duration: player.duration,
          playbackRate: player.rate,
          position: Math.min(player.globalTime, player.duration),
        });
      } catch {
        /* Position state is optional. */
      }
    }
  }, [catalog, playEpisode, player.duration, player.episodeId, player.globalTime, player.rate, player.status, seekBy, toggle]);

  const daily = dailyListening({
    path,
    progress,
    playableIds: ids,
    durations: Object.fromEntries(catalog.episodes.map((episode) => [episode.id, episode.durationSeconds])),
    plannedMinutes: settings.dailyMinutes,
  });

  const value: LibraryValue = {
    catalog,
    settings,
    progress,
    path,
    player,
    hydrated,
    reduceMotion: settings.reduceMotion || systemReduce,
    updateSettings: (patch) => setSettings((current) => ({ ...current, ...patch })),
    addEpisode: (id) => setPath((current) => addToPath(current, id, ids, new Date().toISOString()).path),
    removeEpisode: (id) => setPath((current) => removeFromPath(current, id, new Date().toISOString()).path),
    moveEpisode: (index, direction) => setPath((current) => moveStep(current, index, direction, new Date().toISOString()).path),
    loadEpisode,
    playEpisode,
    toggle,
    seek,
    seekBy,
    setRate,
    setDragging: (value) => {
      dragging.current = value;
    },
    setSleep: (minutes) => setSleepUntil(minutes ? sleepDeadline(minutes, Date.now()) : null),
    sleepRemainingMs: sleepRemainingMs(sleepUntil, clock),
    daily,
  };

  return (
    <LibraryContext.Provider value={value}>
      {children}
      <audio
        ref={rememberFirst}
        className="audio-keep"
        preload="auto"
        onEnded={() => onEnded(0)}
        onError={(event) => {
          if (!event.currentTarget.dataset.assignedSrc) return;
          reportError(new Error("audio"));
        }}
      />
      <audio
        ref={rememberSecond}
        className="audio-keep"
        preload="auto"
        onEnded={() => onEnded(1)}
        onError={(event) => {
          if (!event.currentTarget.dataset.assignedSrc) return;
          reportError(new Error("audio"));
        }}
      />
    </LibraryContext.Provider>
  );
}
