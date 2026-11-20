import { describe, expect, it } from "vitest";
import indice from "../../../content/canon/catalogo-indice.json";
import type { Rango } from "./caminos";
import { RETOS_APP, PROFECIAS_ID } from "./retos-app";
import { readFileSync } from "node:fs";
import { pasosDeReto, estadoDeReto, fechaCorta, marcadorHoy, modeloRetos, organizarRetos, rangoFechas, tramosDelAnio, ventanaDeReto } from "./temporadas";

const rangos = indice.rangos as Rango[];

describe("temporadas litúrgicas 2026-27", () => {
  it("fechas reales", () => {
    expect(ventanaDeReto("adviento-isaias")).toEqual({ inicio: "2026-11-29", fin: "2026-12-24" });
    expect(ventanaDeReto("navidad-infancia")).toEqual({ inicio: "2026-12-25", fin: "2027-01-10" });
    expect(ventanaDeReto("ordinario-evangelio")).toEqual({ inicio: "2027-01-11", fin: "2027-02-09" });
    expect(ventanaDeReto("cuaresma-40")).toEqual({ inicio: "2027-02-10", fin: "2027-03-20" });
    expect(ventanaDeReto("semana-santa-pasion")).toEqual({ inicio: "2027-03-21", fin: "2027-03-27" });
    expect(ventanaDeReto("pascua-hechos")).toEqual({ inicio: "2027-03-28", fin: "2027-05-16" });
    expect(ventanaDeReto("ordinario-salmos")).toEqual({ inicio: "2027-05-17", fin: "2027-11-27" });
  });
  it("estado y textos de fecha", () => {
    const adv = ventanaDeReto("adviento-isaias");
    expect(estadoDeReto(adv, "2026-11-20")).toBe("empieza");
    expect(estadoDeReto(adv, "2026-12-01")).toBe("en-curso");
    expect(estadoDeReto(adv, "2026-12-25")).toBe("terminado");
    expect(fechaCorta("2026-11-29", "es")).toBe("29 nov");
    expect(rangoFechas(adv, "es")).toBe("29 nov – 24 dic");
    expect(rangoFechas(adv, "en")).toBe("Nov 29 – Dec 24");
  });
  it("ordena por calendario, no repite obra y cuenta el progreso", () => {
    const m = modeloRetos({ lang: "es", hoyIso: "2026-11-20", rangos, progress: { episodes: { "is-01": { completed: true }, "is-02": { completed: true } } } });
    expect(m.temporadas[0]?.id).toBe("adviento-isaias");
    expect(m.temporadas[0]).toMatchObject({ hechos: 3, total: 26, estado: "empieza", destacado: true, siguiente: "is-03" });
    const inicios = m.temporadas.map((t) => t.inicio);
    expect([...inicios].sort()).toEqual(inicios);
    const pintadas = [m.principal.src, ...m.temporadas.filter((t) => !t.sinObra).map((t) => t.src)];
    // Los retos sin pintura todavía llevan placa de marca, no una obra repetida.
    expect(m.temporadas.filter((t) => !t.sinObra).every((t) => Boolean(t.src))).toBe(true);
    expect(new Set(pintadas).size).toBe(pintadas.length);
    expect(m.principal.total).toBe(516);
  });
});

describe("Profecías de la Pasión", () => {
  const catalogo = new Set((indice.episodes as { id: string }[]).map((e) => e.id));
  const rangoIds = new Set(rangos.map((r) => r.id));
  it("está en Semana Santa, del 21 al 28 de marzo (Ramos a Pascua), con 8 días", () => {
    const reto = RETOS_APP.find((r) => r.id === PROFECIAS_ID)!;
    expect(reto.tiempo).toBe("semana-santa");
    expect(reto.pasos).toHaveLength(8);
    expect(ventanaDeReto(PROFECIAS_ID)).toEqual({ inicio: "2027-03-21", fin: "2027-03-28" });
    const m = modeloRetos({ lang: "es", hoyIso: "2026-11-20", rangos, progress: { episodes: {} } });
    const t = m.temporadas.find((x) => x.id === PROFECIAS_ID)!;
    expect(t).toMatchObject({ estado: "empieza", total: 8, hechos: 0, sinObra: false, fechas: "21 mar – 28 mar", src: "/obras/reto-profecias_o1-1x1.webp" });
    const ids = m.temporadas.map((x) => x.id);
    expect(ids.indexOf(PROFECIAS_ID)).toBeGreaterThan(ids.indexOf("cuaresma-40"));
    expect(ids.indexOf(PROFECIAS_ID)).toBeLessThan(ids.indexOf("pascua-hechos"));
    expect(modeloRetos({ lang: "en", hoyIso: "2026-11-20", rangos, progress: { episodes: {} } }).temporadas.find((x) => x.id === PROFECIAS_ID)?.titulo).toBe("Prophecies of the Passion");
  });
  it("todos los días pp-NN son Próximamente y llevan profecía, cumplimiento y descripción", () => {
    const pasos = pasosDeReto(PROFECIAS_ID);
    expect(pasos.map((p) => p.dia)).toEqual(Array.from({ length: 8 }, (_, i) => i + 1));
    for (const p of pasos) {
      expect(p.episodio).toMatch(/^pp-\d\d$/);
      expect(catalogo.has(p.episodio!)).toBe(false);
      expect(p.profecia && p.cumplimiento && p.descripcion?.es && p.descripcion?.en).toBeTruthy();
      expect(p.descripcion!.es).not.toMatch(/la narración|cita combinada|tipolog/i);
      expect((p as { nota?: unknown }).nota).toBeUndefined();
    }
    expect(pasos.map((p) => p.titulo.es)).toEqual([
      "Viene tu rey",
      "Treinta monedas de plata",
      "El que compartía mi pan",
      "Hiere al pastor",
      "Como cordero llevado al matadero",
      "Dios mío, ¿por qué me has abandonado?",
      "Mirarán al que traspasaron",
      "Al tercer día",
    ]);
    expect(pasos[0]).toMatchObject({ profecia: "Za 9,9–10", cumplimiento: "Mt 21,1–17", diaLiturgico: "Domingo de Ramos" });
    expect(pasos[0].descripcion?.es).toContain("Jesús entra en Jerusalén");
    const reto = RETOS_APP.find((r) => r.id === PROFECIAS_ID);
    expect(reto?.descripcion?.es).toContain("Te invitamos a escuchar");
    expect(reto?.descripcion?.en).toContain("We invite you to listen");
    expect(pasos[0].referencias).toHaveLength(3);
    for (const p of pasos) expect(p.minutos).toBeGreaterThanOrEqual(10);
    for (const p of pasos) expect(p.minutos).toBeLessThanOrEqual(13);
    expect(pasos.reduce((suma, p) => suma + (p.minutos ?? 0), 0)).toBe(93);
    const refs = pasos.flatMap((p) => (p.referencias ?? []).map((r) => `${r.profecia} → ${r.cumplimiento}`));
    expect(refs.some((r) => r.includes("Jr 11,18–20"))).toBe(true);
    expect(refs.some((r) => r.includes("Am 8,9–10"))).toBe(true);
    expect(refs.some((r) => r.includes("Dt 21,22–23"))).toBe(true);
    expect(refs.some((r) => r.startsWith("Gn 22,1–18"))).toBe(true);
    expect(refs.some((r) => r.includes("Jon 2,1–11") && r.includes("Mt 12,38–40"))).toBe(true);
  });
  it("los episodios relacionados existen en el canon y algunos ya tienen audio", () => {
    const relacionados = pasosDeReto(PROFECIAS_ID).flatMap((p) => p.relacionados ?? []);
    expect(relacionados.length).toBeGreaterThan(8);
    for (const id of relacionados) expect(rangoIds.has(id)).toBe(true);
    expect(relacionados.some((id) => catalogo.has(id))).toBe(true);
    expect(catalogo.has("is-15") || rangoIds.has("is-15")).toBe(true);
  });
});

describe("listado de retos: héroe, rail y cuadrícula", () => {
  const vacio = { episodes: {} };
  it("en noviembre el héroe es el Adviento que empieza el 29 nov", () => {
    const m = modeloRetos({ lang: "es", hoyIso: "2026-11-20", rangos, progress: vacio });
    const org = organizarRetos(m.temporadas)!;
    expect(org.heroe.id).toBe("adviento-isaias");
    expect(org.heroe.estado).toBe("empieza");
    expect(org.siguientes.length).toBeGreaterThan(0);
    expect(org.siguientes.length).toBeLessThanOrEqual(4);
  });
  it("si hay uno en curso, ese es el héroe", () => {
    const m = modeloRetos({ lang: "es", hoyIso: "2027-02-20", rangos, progress: vacio });
    expect(organizarRetos(m.temporadas)!.heroe.id).toBe("cuaresma-40");
  });
  it("héroe, rail y cuadrícula reparten todos los retos una sola vez y sin obra repetida", () => {
    for (const hoyIso of ["2026-11-20", "2026-12-10", "2027-03-01", "2027-06-01", "2028-01-01"]) {
      const m = modeloRetos({ lang: "es", hoyIso, rangos, progress: vacio });
      const org = organizarRetos(m.temporadas)!;
      const vistos = [org.heroe, ...org.siguientes, ...org.resto];
      expect(vistos.map((r) => r.id).sort()).toEqual(m.temporadas.map((r) => r.id).sort());
      const obras = vistos.filter((r) => !r.sinObra).map((r) => r.src);
      expect(obras.every(Boolean)).toBe(true);
      expect(new Set(obras).size).toBe(obras.length);
    }
  });
  it("la línea del año va de Adviento a Adviento y «hoy» cae en su tramo", () => {
    const tramos = tramosDelAnio();
    expect(tramos.map((x) => x.tiempo)).toEqual(["adviento", "navidad", "ordinario", "cuaresma", "semana-santa", "pascua", "ordinario"]);
    expect(marcadorHoy(tramos, "2026-11-20")).toEqual({ indice: 0, fraccion: 0 });
    expect(marcadorHoy(tramos, "2026-12-01").indice).toBe(0);
    expect(marcadorHoy(tramos, "2027-03-01").indice).toBe(3);
    expect(marcadorHoy(tramos, "2027-12-30")).toEqual({ indice: 6, fraccion: 1 });
  });
  it("la obra no se recorta: ObraMarco usa contain y ningún cartel usa cover", () => {
    const leer = (f: string) => readFileSync(new URL(f, import.meta.url), "utf8");
    expect(leer("./ui/ObraMarco.tsx")).toContain('resizeMode="contain"');
    expect(leer("./ui/RetoCard.tsx")).not.toContain('"cover"');
    expect(leer("./app/retos.tsx")).not.toContain('"cover"');
    for (const f of ["./app/entrar.tsx", "./app/bienvenida.tsx", "./ui/HeroCard.tsx"]) expect(leer(f)).not.toContain('"cover"');
  });
});
