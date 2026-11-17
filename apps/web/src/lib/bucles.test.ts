import { describe, expect, it } from "vitest";
import { bucleDeEpisodio, bucleDeHero, fusionarBucles, fuentesParaAncho, type Bucle } from "./bucles";

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

  it("funde un JSON válido y deja el del repo si viene vacío o roto", () => {
    const base = { "gn-01": { mp4: "https://repo.example/gn.mp4", poster: "https://repo.example/gn.webp", alt: "Repo" } };
    const valido = JSON.stringify({
      "gn-01": { mp4: "https://signed.example/gn.mp4" },
      "is-01": { webm: "https://signed.example/is.webm", poster: "https://signed.example/is.webp", alt: "Isaías" },
    });
    const fundido = fusionarBucles(base, valido);
    expect(fundido["gn-01"]).toEqual({ mp4: "https://signed.example/gn.mp4", poster: "https://repo.example/gn.webp", alt: "Repo" });
    expect(fundido["is-01"]).toEqual({ webm: "https://signed.example/is.webm", poster: "https://signed.example/is.webp", alt: "Isaías" });
    expect(base["gn-01"]?.mp4).toBe("https://repo.example/gn.mp4");
    expect(bucleDeEpisodio("is-01", { NEXT_PUBLIC_BUCLES_JSON: valido })?.webm).toBe("https://signed.example/is.webm");
    expect(bucleDeEpisodio("gn-02", { NEXT_PUBLIC_BUCLES_JSON: valido })).toBeNull();

    expect(fusionarBucles(base, "")).toEqual(base);
    expect(fusionarBucles(base, "   ")).toEqual(base);
    expect(fusionarBucles(base, undefined)).toEqual(base);
    expect(fusionarBucles(base, "{}")).toEqual(base);
    expect(fusionarBucles(base, "{")).toEqual(base);
    expect(fusionarBucles(base, "null")).toEqual(base);
    expect(fusionarBucles(base, "[]")).toEqual(base);
    expect(bucleDeEpisodio("is-01", { NEXT_PUBLIC_BUCLES_JSON: "{" })).toBeNull();
  });
});
