/** @vitest-environment jsdom */
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { BucleCuadro } from "./bucle-cuadro";
import type { Bucle } from "@/lib/bucles";
import { SitioHome } from "@/components/sitio";

const bucle: Bucle = {
  mp4: "https://cdn.example/hero.mp4",
  webm: "https://cdn.example/hero.webm",
  poster: "https://cdn.example/hero.webp",
  mp4Movil: "https://cdn.example/hero-1280.mp4",
  webmMovil: "",
  posterMovil: "https://cdn.example/hero-1280.webp",
  alt: "La creación",
};

function medio(reduce: boolean) {
  vi.stubGlobal("matchMedia", () => ({
    matches: reduce,
    media: "",
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  }));
}

function datos(saveData: boolean) {
  Object.defineProperty(navigator, "connection", { configurable: true, value: { saveData } });
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("BucleCuadro", () => {
  it("el póster lleva priority y el vídeo no está en el HTML inicial", () => {
    const html = renderToStaticMarkup(<BucleCuadro bucle={bucle} priority />);
    expect(html.toLowerCase()).toContain('fetchpriority="high"');
    expect(html).toContain('src="https://cdn.example/hero.webp"');
    expect(html).toContain('media="(max-width: 1280px)"');
    expect(html).not.toContain("<video");
  });

  it("el contenedor se estira con inset y no con height 100%", () => {
    const html = renderToStaticMarkup(
      <div className="relative min-h-[46svh]">
        <BucleCuadro bucle={bucle} priority className="ken-burns absolute inset-0 h-full w-full" />
      </div>,
    );
    const clase = html.match(/class="([^"]*bucle-cuadro[^"]*)"/)?.[1] ?? "";
    const tokens = clase.split(/\s+/);
    expect(tokens).toContain("absolute");
    expect(tokens).toContain("inset-0");
    expect(tokens).not.toContain("h-full");
    expect(tokens).toContain("ken-burns");
  });

  it("con reduced-motion o Save-Data se queda en el póster", async () => {
    medio(true);
    datos(false);
    const { container } = render(<BucleCuadro bucle={bucle} priority />);
    await new Promise((resolver) => setTimeout(resolver, 20));
    expect(container.querySelector("video")).toBeNull();
    expect(container.querySelector("img")?.getAttribute("fetchpriority")).toBe("high");

    cleanup();
    medio(false);
    datos(true);
    const ahorrado = render(<BucleCuadro bucle={bucle} priority />);
    await new Promise((resolver) => setTimeout(resolver, 20));
    expect(ahorrado.container.querySelector("video")).toBeNull();
  });

  it("tras la carga monta un vídeo mudo, en bucle y sin controles", async () => {
    medio(false);
    datos(false);
    vi.stubGlobal("requestIdleCallback", (callback: () => void) => {
      callback();
      return 1;
    });
    vi.stubGlobal("cancelIdleCallback", () => undefined);
    class Observador {
      constructor(private callback: (entradas: { isIntersecting: boolean }[]) => void) {}
      observe() { this.callback([{ isIntersecting: true }]); }
      disconnect() {}
      unobserve() {}
    }
    vi.stubGlobal("IntersectionObserver", Observador);
    HTMLMediaElement.prototype.play = () => Promise.resolve();
    HTMLMediaElement.prototype.pause = () => undefined;
    const { container } = render(<BucleCuadro bucle={bucle} priority />);
    await new Promise((resolver) => setTimeout(resolver, 0));
    const video = container.querySelector("video");
    const sources = [...(video?.querySelectorAll("source") ?? [])];
    expect(video).not.toBeNull();
    expect(sources.map((source) => source.getAttribute("src"))).toEqual([
      "https://cdn.example/hero.webm",
      "https://cdn.example/hero.mp4",
    ]);
    expect(sources.every((source) => !source.hasAttribute("media"))).toBe(true);
    expect(video?.muted).toBe(true);
    expect(video?.loop).toBe(true);
    expect(video?.hasAttribute("controls")).toBe(false);
    expect(video?.getAttribute("preload")).toBe("none");
    expect(video?.getAttribute("aria-hidden")).toBe("true");
    expect(video?.querySelector("track")).toBeNull();
    expect(container.querySelector("img")?.getAttribute("fetchpriority")).toBe("high");
  });

  it("un error en un source no desmonta el vídeo si otro puede reproducirse", async () => {
    medio(false);
    datos(false);
    vi.stubGlobal("requestIdleCallback", (callback: () => void) => {
      callback();
      return 1;
    });
    vi.stubGlobal("cancelIdleCallback", () => undefined);
    class Observador {
      constructor(private callback: (entradas: { isIntersecting: boolean }[]) => void) {}
      observe() { this.callback([{ isIntersecting: true }]); }
      disconnect() {}
      unobserve() {}
    }
    vi.stubGlobal("IntersectionObserver", Observador);
    HTMLMediaElement.prototype.play = () => Promise.resolve();
    HTMLMediaElement.prototype.pause = () => undefined;
    const { container } = render(<BucleCuadro bucle={bucle} priority />);
    await new Promise((resolver) => setTimeout(resolver, 0));
    const video = container.querySelector("video");
    const primero = video?.querySelector("source");
    expect(video).not.toBeNull();
    expect(primero).not.toBeNull();
    await act(async () => {
      primero?.dispatchEvent(new Event("error", { bubbles: true }));
    });
    expect(container.querySelector("video")).not.toBeNull();
    await act(async () => {
      video?.dispatchEvent(new Event("error"));
    });
    expect(container.querySelector("video")).toBeNull();
    expect(container.querySelector("img")?.getAttribute("src")).toBe("https://cdn.example/hero.webp");
  });
});

describe("hero sin bucle", () => {
  it("la home no añade vídeo si no hay URLs", () => {
    const html = renderToStaticMarkup(<SitioHome lang="es" />);
    expect(html).not.toContain("<video");
    expect(html).toContain("parallax-obra");
    expect(html).toContain("gn-01");
  });
});
