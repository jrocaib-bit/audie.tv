import { describe, expect, it } from "vitest";
import { CAJA_MAPA, contextoVacio, partirLinea, proyectar, SILUETA } from "./sala-contexto";
import { contextoSala, reportajePremium } from "./sala-reportaje";
import { idsSala } from "./sala-recorridos";

const PROHIBIDO = /;|—|–|\bGn\b|\bCEE\b|Rijksmuseum|Bonnefanten|Mauritshuis|National Gallery|dominio público|public domain/i;

describe("contexto de reportaje", () => {
  it("gn-01 tiene cita, línea de tiempo y cuatro puntos de mapa en ambos idiomas", () => {
    for (const lang of ["es", "en"] as const) {
      const c = contextoSala("gn-01", lang)!;
      expect(c.cita).toBeTruthy();
      expect(c.lineaTiempo).toHaveLength(5);
      expect(c.mapa!.map((p) => p.id)).toEqual(["amberes", "amsterdam", "la-haya", "maastricht"]);
    }
    expect(contextoSala("gn-01", "es")!.cita).toBe("Una tabla redonda de nogal, pequeña, hecha para mirarse de cerca.");
  });
  it("el contexto público no pasa las reglas de estilo prohibidas ni nombra museos", () => {
    for (const lang of ["es", "en"] as const) {
      const c = contextoSala("gn-01", lang)!;
      const textos = [c.cita!, ...c.lineaTiempo!, ...c.mapa!.flatMap((p) => [p.nombre, p.pie])];
      for (const t of textos) expect(t, t).not.toMatch(PROHIBIDO);
    }
  });
  it("el contexto público no incluye la comparativa ni los radios", () => {
    const json = JSON.stringify(contextoSala("gn-01", "es"));
    expect(json).not.toMatch(/Durero|durero|National Gallery|comparativa|radios/);
  });
  it("la comparativa premium apunta a los webp públicos y los créditos nombran la galería aparte", () => {
    const { comparativa, radios } = reportajePremium("gn-01", "es");
    expect(radios).toHaveLength(5);
    expect(comparativa!.trasPaso).toBe(5);
    expect(comparativa!.imagenes.map((i) => i.src)).toEqual(["/sala/comparativas/gn-01/durero-caida.webp", "/sala/comparativas/gn-01/durero-expulsion.webp"]);
    expect(comparativa!.creditos).toContain("National Gallery of Art");
    for (const t of [comparativa!.entrada, ...comparativa!.imagenes.map((i) => i.pie)]) expect(t, t).not.toMatch(PROHIBIDO);
  });
  it("cualquier otro id: sin contexto ni comparativa (valores por defecto)", () => {
    expect(contextoSala("otra", "es")).toBeNull();
    expect(contextoSala("constructor", "es")).toBeNull();
    expect(reportajePremium("otra", "es")).toEqual({ radios: [], comparativa: null });
    const otras = idsSala().filter((id) => id !== "gn-01");
    expect(otras.length).toBeGreaterThan(70);
    for (const id of otras) expect(contextoSala(id, "es")).toBeNull();
  });
  it("utilidades: contexto vacío, líneas con año y proyección del mapa", () => {
    expect(contextoVacio(null)).toBe(true);
    expect(contextoVacio({})).toBe(true);
    expect(contextoVacio({ cita: "x" })).toBe(false);
    expect(partirLinea("1535. Herry de Patenir.")).toEqual({ anio: "1535", resto: "Herry de Patenir." });
    expect(partirLinea("Hacia 1541. Se pinta.")).toEqual({ anio: "Hacia 1541", resto: "Se pinta." });
    expect(partirLinea("Sin año")).toEqual({ anio: "", resto: "Sin año" });
    for (const p of contextoSala("gn-01", "es")!.mapa!) {
      const { x, y } = proyectar(p.lat, p.lon);
      expect(x).toBeGreaterThan(0);
      expect(x).toBeLessThan(CAJA_MAPA.w);
      expect(y).toBeGreaterThan(0);
      expect(y).toBeLessThan(CAJA_MAPA.h);
    }
    expect(SILUETA.length).toBeGreaterThan(10);
  });
});
