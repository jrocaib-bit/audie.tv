import { describe, expect, it } from "vitest";
import { tarjetasHoy } from "./hoy";
import { baseDeContenido, uriDeObra } from "./entorno";
import { textosAdviento } from "./adviento-textos";
import { familiaSerif } from "./serif";

describe("Hoy y la base de contenido", () => {
  it("no repite ninguna obra y usa el Isaac que sí existe", () => {
    const { libros, caminos, retos } = tarjetasHoy("es");
    const todas = [...libros, ...caminos, ...retos].map((item) => item.src);
    expect(new Set(todas).size).toBe(todas.length);
    const paraiso = todas.filter((src) => src.includes("gn-01_o5"));
    expect(paraiso).toHaveLength(1);
    const isaac = caminos.find((item) => item.titulo === "Isaac")?.src ?? "";
    expect(isaac).toContain("gn-08_o4-960.webp");
    expect(isaac).not.toContain("gn-08_o2");
    expect(libros.find((item) => item.id === "gn-04")?.src).toContain("gn-04_o4-960.webp");
    expect(libros.find((item) => item.id === "gn-06")?.src).toContain("gn-06_o3-960.webp");
    for (const src of [...libros, ...caminos].map((item) => item.src)) {
      expect(src.startsWith("https://")).toBe(true);
      expect(src).not.toContain("audite.tv/obras/");
    }
    expect(retos.map((item) => item.src)).toEqual([
      "/obras/reto-adviento_o2-1x1.webp",
      "/obras/reto-navidad_o2-1x1.webp",
    ]);
    expect(uriDeObra(retos[0]!.src, "https://audite.tv")).toBe("https://audite.tv/obras/reto-adviento_o2-1x1.webp");
    expect(uriDeObra(isaac, "https://audite.tv")).toBe(isaac);
  });

  it("apunta a audite.tv salvo que el entorno diga otra base", () => {
    expect(baseDeContenido(undefined)).toBe("https://audite.tv");
    expect(baseDeContenido("")).toBe("https://audite.tv");
    expect(baseDeContenido("http://127.0.0.1:43123/")).toBe("http://127.0.0.1:43123");
  });

  it("traduce Adviento y no usa Georgia si falta Gazpacho", () => {
    expect(textosAdviento("en").entrar).toBe("Sign up or sign in");
    expect(textosAdviento("es").oir).toBe("Oír");
    expect(familiaSerif(true, "ios")).toBe("Gazpacho");
    expect(familiaSerif(false, "ios")).toBe("Times New Roman");
    expect(familiaSerif(false, "android")).toBe("serif");
    expect(familiaSerif(false, "ios")).not.toBe("Georgia");
  });
});
