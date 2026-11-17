import { describe, expect, it } from "vitest";
import { bucleDeEpisodio, bucleDeHero, fuentesParaAncho, type Bucle } from "./bucles";

const vacio = {
  NEXT_PUBLIC_BUCLE_HERO_MP4: "",
  NEXT_PUBLIC_BUCLE_HERO_WEBM: "",
  NEXT_PUBLIC_BUCLE_HERO_POSTER: "",
  NEXT_PUBLIC_BUCLE_HERO_MP4_1280: "",
  NEXT_PUBLIC_BUCLE_HERO_WEBM_1280: "",
  NEXT_PUBLIC_BUCLE_HERO_POSTER_1280: "",
};

const ejemplo: Bucle = {
  mp4: "https://cdn.example/hero.mp4",
  webm: "https://cdn.example/hero.webm",
  poster: "https://cdn.example/hero.webp",
  mp4Movil: "https://cdn.example/hero-1280.mp4",
  webmMovil: "https://cdn.example/hero-1280.webm",
  posterMovil: "https://cdn.example/hero-1280.webp",
  alt: "",
};

describe("bucles", () => {
  it("sin URLs no hay bucle", () => {
    expect(bucleDeEpisodio("gn-01")).toBeNull();
    expect(bucleDeHero("gn-01", vacio)).toBeNull();
  });

  it("el hero acepta el override de entorno, también en 1280", () => {
    const bucle = bucleDeHero("gn-01", {
      ...vacio,
      NEXT_PUBLIC_BUCLE_HERO_MP4: " https://cdn.example/hero.mp4 ",
      NEXT_PUBLIC_BUCLE_HERO_WEBM: "https://cdn.example/hero.webm",
      NEXT_PUBLIC_BUCLE_HERO_POSTER: "https://cdn.example/hero.webp",
      NEXT_PUBLIC_BUCLE_HERO_MP4_1280: "https://cdn.example/hero-1280.mp4",
      NEXT_PUBLIC_BUCLE_HERO_POSTER_1280: "https://cdn.example/hero-1280.webp",
    });
    expect(fuentesParaAncho(ejemplo, false).map((fuente) => fuente.src)).toEqual([
      "https://cdn.example/hero.webm",
      "https://cdn.example/hero.mp4",
    ]);
    expect(fuentesParaAncho(ejemplo, true).map((fuente) => fuente.src)).toEqual([
      "https://cdn.example/hero-1280.webm",
      "https://cdn.example/hero-1280.mp4",
    ]);
    expect(bucle).toEqual({
      mp4: "https://cdn.example/hero.mp4",
      webm: "https://cdn.example/hero.webm",
      poster: "https://cdn.example/hero.webp",
      mp4Movil: "https://cdn.example/hero-1280.mp4",
      webmMovil: "",
      posterMovil: "https://cdn.example/hero-1280.webp",
      alt: "",
    });
  });
});
