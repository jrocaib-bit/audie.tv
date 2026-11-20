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
  it("cae dentro de Semana Santa, del Domingo de Ramos al Domingo de Pascua de 2027", () => {
    const retos = retosDeTemporada();
    const ids = retos.map((reto) => reto.id);
    expect(ids.indexOf("semana-santa-pasion")).toBe(ids.indexOf("cuaresma-40") + 1);
    expect(ids.indexOf("profecias-pasion")).toBe(ids.indexOf("semana-santa-pasion") + 1);
    const reto = retoDeTemporada("profecias-pasion");
    expect(reto?.tiempo).toBe("semana-santa");
    expect(reto?.slug).toEqual({ es: "profecias-pasion", en: "passion-prophecies" });
    expect(reto?.dias).toHaveLength(8);
    expect(reto?.dias[0]?.fecha).toBe("2027-03-21");
    expect(reto?.dias[7]?.fecha).toBe("2027-03-28");
    expect(reto?.dias.map((dia) => dia.fecha)).toEqual(Array.from({ length: 8 }, (_, indice) => sumar("2027-03-21", indice)));
    expect(ordenarRetosEstacionales(
      [
        { id: "semana-santa-pasion", tiempo: "semana-santa" },
        { id: "profecias-pasion", tiempo: "semana-santa" },
        { id: "cuaresma-40", tiempo: "cuaresma" },
      ],
      "2027-01-01",
    ).map((item) => item.id)).toEqual(["cuaresma-40", "semana-santa-pasion", "profecias-pasion"]);
  });

  it("sigue el calendario litúrgico: un día del Domingo de Ramos al Domingo de Pascua", () => {
    expect(pascua(2027)).toBe("2027-03-28");
    const reto = retoDeTemporada("profecias-pasion");
    const titulos = ["Viene tu rey", "Treinta monedas de plata", "El que compartía mi pan", "Hiere al pastor", "Como cordero llevado al matadero", "Dios mío, ¿por qué me has abandonado?", "Mirarán al que traspasaron", "Al tercer día"];
    const liturgicos = ["Domingo de Ramos", "Lunes Santo", "Martes Santo", "Miércoles Santo", "Jueves Santo", "Viernes Santo", "Sábado Santo", "Domingo de Pascua"];
    expect(sumar(pascua(2027), -7)).toBe("2027-03-21");
    expect(sumar(pascua(2027), -3)).toBe("2027-03-25");
    expect(reto?.dias.map((dia) => dia.es)).toEqual(titulos);
    expect(reto?.dias.map((dia) => dia.diaLiturgico?.es)).toEqual(liturgicos);
    expect(reto?.dias[0]?.fecha).toBe("2027-03-21");
    expect(reto?.dias[4]?.fecha).toBe("2027-03-25");
    expect(reto?.dias[0]?.profecias).toEqual([
      { profecia: "Za 9,9–10", cumplimiento: "Mt 21,1–17" },
      { profecia: "Sal 118,19–29", cumplimiento: "Mt 21,33–46" },
      { profecia: "Is 53,1–3", cumplimiento: "Jn 12,37–41" },
    ]);
    expect(reto?.dias[5]?.nota?.es.startsWith("Viernes Santo")).toBe(true);
    expect(reto?.dias[6]?.nota?.es.startsWith("Jn 19,36")).toBe(true);
    expect(reto?.dias[7]?.nota?.es.startsWith("Domingo de Pascua")).toBe(true);
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
    expect(piezas).toEqual(Array.from({ length: 8 }, (_, indice) => `pp-${String(indice + 1).padStart(2, "0")}`));
    expect(piezas.every((id) => id && !rangos.has(id) && !conAudio.has(id))).toBe(true);
    const texto = readFileSync(new URL("../../../../content/tiempos/profecias-pasion.json", import.meta.url), "utf8");
    expect(texto).not.toMatch(/Conferencia Episcopal|Sagrada Biblia/i);
    expect(reto?.dias.map((dia) => dia.duracion_s)).toEqual([500, 527, 543, 529, 622, 672, 477, 540]);
  });

  it("reserva el hueco de marca y marca la pieza como próxima", () => {
    const reto = retoDeTemporada("profecias-pasion");
    if (!reto) throw new Error("falta el reto");
    expect(portadaConectada(reto, "")).toBe("");
    expect(reto.sinCuadro).toBe(true);
    const html = renderToStaticMarkup(<VistaRetoAnio lang="es" reto={reto} rangos={loadAppCatalog().rangos} />);
    expect(html).toContain("data-hueco=\"marca\"");
    expect(html).toContain("audite_marca");
    expect(html).toContain("Za 9,9–10 → Mt 21,1–17");
    expect(html).toContain("Sal 118,19–29 → Mt 21,33–46");
    expect(html).toContain("Is 53,1–3 → Jn 12,37–41");
    expect(html).toContain("Viene tu rey");
    expect(html).toContain("Domingo de Ramos");
    expect(html).toContain("Treinta monedas de plata");
    expect(html).toContain("Al tercer día");
    expect(html).toContain("href=\"/es/catalogo/is-15\"");
    expect(html).toContain("8:20 · Próximamente");
    expect(html).toContain("11:12 · Próximamente");
    expect((html.match(/Próximamente/g) ?? []).length).toBe(8);
    expect(html).not.toContain("pp-01");
    expect(html).not.toContain("/escuchar");
    expect(html).not.toContain("Conferencia Episcopal");
    process.env.NEXT_PUBLIC_RETO_PROFECIAS_PORTADA = "https://cdn.example/profecias.webp";
    const conectada = renderToStaticMarkup(<VistaRetoAnio lang="es" reto={retoDeTemporada("profecias-pasion")!} rangos={[]} />);
    expect(conectada).toContain("https://cdn.example/profecias.webp");
    expect(conectada).not.toContain("data-hueco=\"marca\"");
  });
});
