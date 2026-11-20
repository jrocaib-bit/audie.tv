import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { pascua } from "@audite/domain";
import { loadAppCatalog } from "@audite/content/app-catalog";
import { VistaRetoAnio } from "@/components/reto-anio";
import { portadaConectada, retoDeTemporada, retosDeTemporada } from "./retos-anio";
import { ordenarRetosEstacionales } from "./publico";

function sumar(iso: string, dias: number): string {
  const [anio, mes, dia] = iso.split("-").map(Number);
  const fecha = new Date(Date.UTC(anio ?? 1970, (mes ?? 1) - 1, dia ?? 1));
  fecha.setUTCDate(fecha.getUTCDate() + dias);
  return fecha.toISOString().slice(0, 10);
}

afterEach(() => {
  delete process.env.NEXT_PUBLIC_RETO_PROFECIAS_PORTADA;
});

describe("Profecías de la Pasión", () => {
  it("ocupa su sitio entre Cuaresma y la Pasión, del 13 al 28 de marzo de 2027", () => {
    const retos = retosDeTemporada();
    const ids = retos.map((reto) => reto.id);
    expect(ids.indexOf("profecias-pasion")).toBe(ids.indexOf("cuaresma-40") + 1);
    expect(ids.indexOf("semana-santa-pasion")).toBe(ids.indexOf("profecias-pasion") + 1);
    const reto = retoDeTemporada("profecias-pasion");
    expect(reto?.tiempo).toBe("semana-santa");
    expect(reto?.slug).toEqual({ es: "profecias-pasion", en: "passion-prophecies" });
    expect(reto?.dias).toHaveLength(16);
    expect(reto?.dias[0]?.fecha).toBe("2027-03-13");
    expect(reto?.dias[15]?.fecha).toBe("2027-03-28");
    expect(reto?.dias.map((dia) => dia.fecha)).toEqual(Array.from({ length: 16 }, (_, indice) => sumar("2027-03-13", indice)));
    expect(ordenarRetosEstacionales(
      [
        { id: "semana-santa-pasion", tiempo: "semana-santa" },
        { id: "profecias-pasion", tiempo: "semana-santa" },
        { id: "cuaresma-40", tiempo: "cuaresma" },
      ],
      "2027-01-01",
    ).map((item) => item.id)).toEqual(["cuaresma-40", "profecias-pasion", "semana-santa-pasion"]);
  });

  it("deja las notas del calendario como están: Ramos el 21 y Jueves Santo el 25", () => {
    expect(pascua(2027)).toBe("2027-03-28");
    const reto = retoDeTemporada("profecias-pasion");
    const ramos = reto?.dias[8];
    const jueves = reto?.dias[12];
    expect(sumar(pascua(2027), -7)).toBe("2027-03-21");
    expect(sumar(pascua(2027), -3)).toBe("2027-03-25");
    expect(ramos?.fecha).toBe("2027-03-21");
    expect(ramos?.nota?.es).toBe("Domingo de Ramos.");
    expect(jueves?.fecha).toBe("2027-03-25");
    expect(jueves?.nota?.es).toBe("Jueves Santo.");
    expect(reto?.dias[13]?.nota?.es.startsWith("Viernes Santo")).toBe(true);
    expect(reto?.dias[14]?.nota?.es.startsWith("Sábado Santo")).toBe(true);
    expect(reto?.dias[15]?.nota?.es.startsWith("Domingo de Pascua")).toBe(true);
  });

  it("enlaza episodios del catálogo y no activa las piezas pp", () => {
    const catalogo = loadAppCatalog();
    const rangos = new Set(catalogo.rangos.map((rango) => rango.id));
    const conAudio = new Set(catalogo.episodes.map((episodio) => episodio.id));
    const reto = retoDeTemporada("profecias-pasion");
    const relacionados = reto?.dias.flatMap((dia) => dia.relacionados ?? []) ?? [];
    expect(new Set(relacionados).size).toBeGreaterThan(0);
    expect(relacionados.every((id) => rangos.has(id))).toBe(true);
    const piezas = reto?.dias.map((dia) => dia.pieza) ?? [];
    expect(piezas).toEqual(Array.from({ length: 16 }, (_, indice) => `pp-${String(indice + 1).padStart(2, "0")}`));
    expect(piezas.every((id) => id && !rangos.has(id) && !conAudio.has(id))).toBe(true);
    const texto = readFileSync(new URL("../../../../content/tiempos/profecias-pasion.json", import.meta.url), "utf8");
    expect(texto).not.toMatch(/Conferencia Episcopal|Sagrada Biblia/i);
    expect(reto?.dias.map((dia) => dia.duracion_s)).toContain(39);
    expect(reto?.dias.map((dia) => dia.duracion_s)).toContain(38);
  });

  it("reserva el hueco de marca y marca la pieza como próxima", () => {
    const reto = retoDeTemporada("profecias-pasion");
    if (!reto) throw new Error("falta el reto");
    expect(portadaConectada(reto, "")).toBe("");
    expect(reto.sinCuadro).toBe(true);
    const html = renderToStaticMarkup(<VistaRetoAnio lang="es" reto={reto} rangos={loadAppCatalog().rangos} />);
    expect(html).toContain("data-hueco=\"marca\"");
    expect(html).toContain("audite_marca");
    expect(html).toContain("Is 53,1–5 → Jn 12,37–41");
    expect(html).toContain("Umbral de la Pasión");
    expect(html).toContain("href=\"/es/catalogo/is-15\"");
    expect(html).toContain("1:28 · Próximamente");
    expect(html).not.toContain("pp-01");
    expect(html).not.toContain("/escuchar");
    expect(html).not.toContain("Conferencia Episcopal");
    process.env.NEXT_PUBLIC_RETO_PROFECIAS_PORTADA = "https://cdn.example/profecias.webp";
    const conectada = renderToStaticMarkup(<VistaRetoAnio lang="es" reto={retoDeTemporada("profecias-pasion")!} rangos={[]} />);
    expect(conectada).toContain("https://cdn.example/profecias.webp");
    expect(conectada).not.toContain("data-hueco=\"marca\"");
  });
});
