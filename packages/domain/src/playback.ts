import { segmentAt, type MediaSegment } from "./segments";

export interface AudioPort {
  src: string;
  currentTime: number;
  playbackRate: number;
  paused: boolean;
  preload: string;
  play: () => Promise<void>;
  pause: () => void;
}

export class JoinedPlayback {
  private activeIndex = 0;
  private rate = 1;
  private segments: MediaSegment[] = [];

  constructor(private readonly ports: readonly AudioPort[]) {}

  get segmentCount(): number {
    return this.segments.length;
  }

  activePortIndex(): number {
    return this.activeIndex;
  }

  configure(segments: readonly MediaSegment[], resumeGlobal: number, rate: number): number {
    if (segments.length === 0) throw new Error("An episode needs at least one audio segment.");
    if (segments.length > this.ports.length) {
      throw new Error("Not enough audio outputs for this episode.");
    }
    this.segments = segments.map((segment) => ({ ...segment }));
    this.rate = rate;
    this.segments.forEach((segment, index) => {
      const port = this.ports[index];
      port.preload = "auto";
      port.src = segment.url;
      port.playbackRate = rate;
    });
    return this.seek(resumeGlobal, false);
  }

  setRate(rate: number): void {
    this.rate = rate;
    this.ports.forEach((port) => {
      port.playbackRate = rate;
    });
  }

  seek(globalSeconds: number, resumePlayback: boolean): number {
    const resolved = segmentAt(this.segments, globalSeconds);
    if (!resolved) return 0;
    const index = this.segments.findIndex((segment) => segment.id === resolved.segment.id);
    this.ports.forEach((port, portIndex) => {
      if (portIndex !== index) port.pause();
    });
    this.activeIndex = Math.max(0, index);
    const port = this.ports[this.activeIndex];
    port.playbackRate = this.rate;
    port.currentTime = resolved.localSeconds;
    if (resumePlayback) void port.play();
    return resolved.segment.startSeconds + resolved.localSeconds;
  }

  play(): Promise<void> {
    const port = this.ports[this.activeIndex];
    port.playbackRate = this.rate;
    return port.play();
  }

  pause(): void {
    this.ports.forEach((port) => port.pause());
  }

  currentGlobal(): number {
    const segment = this.segments[this.activeIndex];
    const port = this.ports[this.activeIndex];
    if (!segment || !port) return 0;
    return segment.startSeconds + (Number.isFinite(port.currentTime) ? port.currentTime : 0);
  }

  handleEnded(portIndex: number): { kind: "ignored" } | { kind: "advanced"; global: number } | { kind: "complete" } {
    if (portIndex !== this.activeIndex) return { kind: "ignored" };
    const next = this.segments[this.activeIndex + 1];
    if (!next) {
      this.pause();
      return { kind: "complete" };
    }
    this.ports[this.activeIndex]?.pause();
    this.activeIndex += 1;
    const port = this.ports[this.activeIndex];
    port.currentTime = 0;
    port.playbackRate = this.rate;
    void port.play();
    return { kind: "advanced", global: next.startSeconds };
  }
}
