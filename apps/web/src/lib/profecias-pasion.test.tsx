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
  delete process.env.NEXT_PUBLIC_RETO_PROFECIAS_MINIATURAS_BASE;
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
    expect(reto?.insignia).toEqual({ es: "Cordero", en: "Lamb" });
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
    expect(reto?.dias[5]?.descripcion?.es.startsWith("Es Viernes Santo")).toBe(true);
    expect(reto?.dias[6]?.descripcion?.es.startsWith("Jesús ha muerto")).toBe(true);
    expect(reto?.dias[7]?.descripcion?.es.startsWith("Es Domingo de Pascua")).toBe(true);
    expect(reto?.explica.es).toContain("Te invitamos a escuchar");
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
    expect(texto).not.toMatch(/"nota"/);
    expect(texto).not.toMatch(/la narración presenta|cita combinada|tipolog/i);
    expect(reto?.dias.every((dia) => dia.descripcion && !("nota" in dia))).toBe(true);
    expect(reto?.dias.map((dia) => dia.duracion_s)).toEqual([660, 629, 625, 615, 753, 784, 785, 762]);
    expect(reto?.dias.reduce((suma, dia) => suma + (dia.duracion_s ?? 0), 0)).toBe(5613);
    expect(texto).not.toMatch(/malhechores|con los malvados/i);
    expect(reto?.dias[4]?.profecias?.some((par) => par.profecia.includes("Jr 11,18"))).toBe(true);
    expect(reto?.dias[5]?.profecias?.some((par) => par.profecia === "Am 8,9–10")).toBe(true);
    expect(reto?.dias[6]?.profecias).toEqual([
      { profecia: "Sal 31,2–6", cumplimiento: "Lc 23,44–56" },
      { profecia: "Dt 21,22–23", cumplimiento: "Jn 19,31–42" },
      { profecia: "Ex 12,43–47; Sal 34,16–23; Za 12,10–14; 13,1", cumplimiento: "Jn 19,31–42" },
      { profecia: "Gn 22,1–18" },
    ]);
    expect(reto?.dias[7]?.profecias).toEqual([
      { profecia: "Sal 16,1–11", cumplimiento: "Hch 2,22–36" },
      { profecia: "Os 6,1–3", cumplimiento: "Lc 24,13–35.44–48" },
      { profecia: "Jon 2,1–11", cumplimiento: "Mt 12,38–40" },
    ]);
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
    expect(html).toContain("Es Domingo de Ramos. Jesús se acerca a Jerusalén");
    expect(html).toContain("Te invitamos a escuchar");
    expect(html).not.toContain("La narración presenta");
    expect(html).not.toContain("se lee tal cual");
    expect(html).toContain("Domingo de Ramos");
    expect(html).toContain("Treinta monedas de plata");
    expect(html).toContain("Al tercer día");
    expect(html).toContain("href=\"/es/catalogo/is-15\"");
    expect(html).toContain("10:15 · Próximamente");
    expect(html).toContain("13:05 · Próximamente");
    expect(html).toContain("Jr 11,18–20");
    expect(html).toContain("Am 8,9–10 → Mt 27,39–46");
    expect(html).toContain("Dt 21,22–23 → Jn 19,31–42");
    expect(html).toContain("Gn 22,1–18");
    expect(html).not.toContain("Gn 22,1–18 →");
    expect(html).toContain("Jon 2,1–11 → Mt 12,38–40");
    expect(html).toContain("Os 6,1–3 → Lc 24,13–35.44–48");
    expect(html).toContain("href=\"/es/catalogo/jer-06\"");
    expect(html).toContain("href=\"/es/catalogo/am-03\"");
    expect(html).toContain("href=\"/es/catalogo/dt-10\"");
    expect(html).toContain("href=\"/es/catalogo/gn-08\"");
    expect(html).toContain("href=\"/es/catalogo/jon-01\"");
    expect((html.match(/Próximamente/g) ?? []).length).toBe(8);
    expect(html).not.toContain("pp-01");
    expect(html).not.toContain("/escuchar");
    expect(html).not.toContain("Conferencia Episcopal");
    process.env.NEXT_PUBLIC_RETO_PROFECIAS_PORTADA = "https://cdn.example/profecias.webp";
    process.env.NEXT_PUBLIC_RETO_PROFECIAS_MINIATURAS_BASE = "https://cdn.example/pp";
    const conectada = renderToStaticMarkup(<VistaRetoAnio lang="es" reto={retoDeTemporada("profecias-pasion")!} rangos={[]} />);
    expect(conectada).toContain("https://cdn.example/profecias.webp");
    expect(conectada).toContain("El cordero sacrificial");
    expect(conectada).toContain("Josefa de Ayala");
    expect(conectada).toContain("https://cdn.example/pp/pp-01_es_miniatura_v1.webp");
    expect(conectada).toContain("https://cdn.example/pp/pp-08_es_miniatura_v1.webp");
    expect(conectada).toContain("Roslin");
    expect(conectada).not.toContain("data-hueco=\"marca\"");
    const ingles = renderToStaticMarkup(<VistaRetoAnio lang="en" reto={retoDeTemporada("profecias-pasion")!} rangos={[]} />);
    expect(ingles).toContain("Prophecies of the Passion");
    expect(ingles).toContain("It is Palm Sunday. Jesus nears Jerusalem");
    expect(ingles).toContain("We invite you to listen");
    expect(ingles).not.toContain("The narration");
    expect(ingles).toContain("Lamb");
    expect(ingles).toContain("The Sacrificial Lamb");
    expect(ingles).toContain("Coming soon");
    expect((ingles.match(/Coming soon/g) ?? []).length).toBe(8);
  });
});
