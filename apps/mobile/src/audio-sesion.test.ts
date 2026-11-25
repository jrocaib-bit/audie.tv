import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { debeReafirmarSesion, MODO_AUDIO, REAFIRMAR_MS } from "./audio-sesion";

const raiz = path.resolve(__dirname, "..");
const leer = (rel: string) => readFileSync(path.join(raiz, rel), "utf8");

function ficheros(dir: string): string[] {
  return readdirSync(dir).flatMap((nombre) => {
    const ruta = path.join(dir, nombre);
    if (statSync(ruta).isDirectory()) return ficheros(ruta);
    return /\.(ts|tsx)$/.test(nombre) && !/\.test\./.test(nombre) ? [ruta] : [];
  });
}

describe("configuración de audio en segundo plano", () => {
  it("app.json activa la reproducción en segundo plano de expo-audio", () => {
    const plugins = JSON.parse(leer("app.json")).expo.plugins as unknown[];
    const entrada = plugins.find((p) => Array.isArray(p) && p[0] === "expo-audio") as [string, Record<string, unknown>] | undefined;
    expect(entrada).toBeDefined();
    expect(entrada![1].enableBackgroundPlayback).toBe(true);
  });

  it("app.config.js conserva los plugins del estático", () => {
    const config = require(path.join(raiz, "app.config.js"));
    const resultado = config({});
    const plugins = resultado.plugins as unknown[];
    const entrada = plugins.find((p) => Array.isArray(p) && p[0] === "expo-audio") as [string, Record<string, unknown>] | undefined;
    expect(entrada?.[1].enableBackgroundPlayback).toBe(true);
  });

  it("MODO_AUDIO no es mezclable y suena en segundo plano", () => {
    expect(MODO_AUDIO.shouldPlayInBackground).toBe(true);
    expect(MODO_AUDIO.playsInSilentMode).toBe(true);
    expect(MODO_AUDIO.interruptionMode).toBe("doNotMix");
  });

  it("state.tsx usa MODO_AUDIO y reafirma la sesión desde AppState", () => {
    const fuente = leer("src/state.tsx");
    const llamadas = fuente.match(/setAudioModeAsync\(([^)]*)\)/g) ?? [];
    expect(llamadas.length).toBeGreaterThan(0);
    for (const l of llamadas) expect(l).toBe("setAudioModeAsync(MODO_AUDIO)");
    expect(fuente).not.toMatch(/setAudioModeAsync\(\s*\{/);
    const bloque = fuente.slice(fuente.indexOf("AppState.addEventListener"));
    expect(bloque.slice(0, 700)).toContain("reafirmarSesion");
  });

  it("ningún useVideoPlayer activa Now Playing ni sesión en segundo plano", () => {
    for (const f of ficheros(path.join(raiz, "src"))) {
      const fuente = readFileSync(f, "utf8");
      if (!fuente.includes("useVideoPlayer")) continue;
      expect(fuente, f).not.toMatch(/showNowPlayingNotification\s*=\s*true/);
      expect(fuente, f).not.toMatch(/staysActiveInBackground\s*=\s*true/);
    }
  });
});

describe("debeReafirmarSesion", () => {
  it("reafirma al ir a segundo plano solo si suena", () => {
    expect(debeReafirmarSesion({ estadoApp: "background", sonando: true })).toBe(true);
    expect(debeReafirmarSesion({ estadoApp: "inactive", sonando: true })).toBe(true);
    expect(debeReafirmarSesion({ estadoApp: "background", sonando: false })).toBe(false);
    expect(debeReafirmarSesion({ estadoApp: "inactive", sonando: false })).toBe(false);
  });
  it("reafirma al volver a activo", () => {
    expect(debeReafirmarSesion({ estadoApp: "active", sonando: false })).toBe(true);
    expect(debeReafirmarSesion({ estadoApp: "active", sonando: true })).toBe(true);
  });
  it("ignora otros estados y el retardo es breve", () => {
    expect(debeReafirmarSesion({ estadoApp: "unknown", sonando: true })).toBe(false);
    expect(REAFIRMAR_MS).toBeGreaterThanOrEqual(200);
    expect(REAFIRMAR_MS).toBeLessThanOrEqual(500);
  });
});
