import { clamp } from "./time";

export const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 2] as const;
export type PlaybackRate = (typeof PLAYBACK_RATES)[number];

export function isPlaybackRate(value: unknown): value is PlaybackRate {
  return typeof value === "number" && (PLAYBACK_RATES as readonly number[]).includes(value);
}

export type PlayerStatus = "idle" | "paused" | "playing" | "ended" | "error";

export type PlayerState = {
  episodeId: string | null;
  status: PlayerStatus;
  globalTime: number;
  duration: number;
  rate: PlaybackRate;
  error: string | null;
};

export const initialPlayerState: PlayerState = {
  episodeId: null,
  status: "idle",
  globalTime: 0,
  duration: 0,
  rate: 1,
  error: null,
};

export type PlayerEvent =
  | { type: "load"; episodeId: string; duration: number; globalTime: number; rate: PlaybackRate }
  | { type: "play" }
  | { type: "pause" }
  | { type: "tick"; globalTime: number }
  | { type: "seek"; globalTime: number }
  | { type: "set-rate"; rate: PlaybackRate }
  | { type: "ended" }
  | { type: "error"; message: string };

export function playerReducer(state: PlayerState, event: PlayerEvent): PlayerState {
  switch (event.type) {
    case "load":
      return {
        episodeId: event.episodeId,
        status: "paused",
        globalTime: clamp(event.globalTime, 0, event.duration),
        duration: event.duration,
        rate: event.rate,
        error: null,
      };
    case "play":
      if (!state.episodeId || state.status === "error") return state;
      return {
        ...state,
        status: "playing",
        error: null,
        globalTime: state.status === "ended" ? 0 : state.globalTime,
      };
    case "pause":
      if (state.status !== "playing") return state;
      return { ...state, status: "paused" };
    case "tick":
      if (state.status !== "playing") return state;
      return { ...state, globalTime: clamp(event.globalTime, 0, state.duration || event.globalTime) };
    case "seek": {
      const globalTime = clamp(event.globalTime, 0, state.duration);
      const status =
        state.status === "ended" || state.status === "idle" || state.status === "error" ? "paused" : state.status;
      return { ...state, globalTime, status, error: null };
    }
    case "set-rate":
      return { ...state, rate: event.rate };
    case "ended":
      return { ...state, status: "ended", globalTime: state.duration };
    case "error":
      return { ...state, status: "error", error: event.message };
    default:
      return state;
  }
}
