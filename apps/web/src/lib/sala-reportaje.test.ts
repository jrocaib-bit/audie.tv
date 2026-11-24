import { describe, expect, it } from "vitest";
import { CAJA_MAPA, cajaDe, contextoVacio, esMarcoNeerlandes, marcoDe, partirLinea, proyectar, proyectarEn, SILUETA } from "./sala-contexto";
import { siluetaEuropa } from "./sala-mapa-europa";
import { contextoSala, reportajePremium } from "./sala-reportaje";
import { idsSala, recorridoSala } from "./sala-recorridos";

const PROHIBIDO = /;|—|–|\bGn\b|\bCEE\b|Rijksmuseum|Bonnefanten|Mauritshuis|National Gallery|dominio público|public domain/i;
/** Reglas de estilo del contexto público de las 79: sin punto y coma ni rayas, sin libros bíblicos abreviados ni CEE, sin museos ni licencias. */
const ESTILO = /;|—|–|\b(Gn|Ex|Lv|Nm|Dt|Is|Jr|Ez|Dn|Mt|Mc|Lc|Jn|Gen|Exod|Lev|Isa|Matt)\b\.?\s*\d|\bCEE\b|Rijksmuseum|Metropolitan|\bThe Met\b|National Gallery|Bonnefanten|Mauritshuis|Getty|Cleveland|Art Institute|Gem[äa]ldegalerie|Staatliche Museen|Varsovia|Warsaw|Rylands|Uffizi|Prado|Louvre|Kunsthistorisches|British Museum|Museum|Museo|dominio público|public domain|CC0/i;
const NEGACION_INICIAL = /^(No|Nadie|Nunca|Nada|Ni|Not|Never|Nobody|Nothing|Neither|None)\b/i;
const CONTRAPOSICION = /\bno\b[^.]{0,80}\bsino\b|\bnot\b[^.]{0,80}\bbut\b|\bno es\b[^.]{0,80}\bes\b|\bit is not\b[^.]{0,80}\bit is\b/i;
const textosDe = (c: NonNullable<ReturnType<typeof contextoSala>>) => [c.cita!, ...c.lineaTiempo!, ...c.mapa!.flatMap((p) => [p.nombre, p.pie])];

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
  it("las 79 obras tienen cita, línea de tiempo (2 a 5) y mapa (1 a 4 puntos) en ambos idiomas", () => {
    const ids = idsSala();
    expect(ids).toHaveLength(79);
    for (const id of ids) {
      for (const lang of ["es", "en"] as const) {
        const c = contextoSala(id, lang);
        expect(c, id).not.toBeNull();
        expect(c!.cita!.trim().length, id).toBeGreaterThan(20);
        expect(c!.lineaTiempo!.length, id).toBeGreaterThanOrEqual(2);
        expect(c!.lineaTiempo!.length, id).toBeLessThanOrEqual(5);
        for (const l of c!.lineaTiempo!) {
          expect(l.trim(), id).not.toBe("");
          expect(partirLinea(l).anio, `${id}: ${l}`).not.toBe("");
        }
        expect(c!.mapa!.length, id).toBeGreaterThanOrEqual(1);
        expect(c!.mapa!.length, id).toBeLessThanOrEqual(4);
        for (const p of c!.mapa!) {
          expect(Number.isFinite(p.lat) && Number.isFinite(p.lon), `${id} ${p.id}`).toBe(true);
          expect(p.nombre, id).toBeTruthy();
          expect(p.pie, id).toBeTruthy();
        }
      }
      expect(contextoSala(id, "es")!.mapa!.map((p) => p.id), id).toEqual(contextoSala(id, "en")!.mapa!.map((p) => p.id));
      expect(contextoSala(id, "es")!.lineaTiempo!.length, id).toBe(contextoSala(id, "en")!.lineaTiempo!.length);
    }
  });
  it("el contexto público de las 79 no incluye comparativa ni radios y cumple las reglas de estilo", () => {
    for (const id of idsSala()) {
      for (const lang of ["es", "en"] as const) {
        const c = contextoSala(id, lang)!;
        expect(Object.keys(c).sort(), id).toEqual(["cita", "lineaTiempo", "mapa"]);
        const json = JSON.stringify(c);
        expect(json, id).not.toMatch(/comparativa|radios|durero-|\.webp/i);
        for (const t of textosDe(c)) {
          expect(t, `${id}: ${t}`).not.toMatch(ESTILO);
          expect(t, `${id}: ${t}`).not.toMatch(NEGACION_INICIAL);
          expect(t, `${id}: ${t}`).not.toMatch(CONTRAPOSICION);
        }
      }
    }
  });
  it("cada obra mapea solo lugares euro-mediterráneos y todos sus puntos caen en su caja", () => {
    for (const id of idsSala()) {
      const pts = contextoSala(id, "es")!.mapa!;
      const m = marcoDe(pts);
      const { w, h } = cajaDe(m);
      for (const p of pts) {
        expect(p.lat, `${id} ${p.id}`).toBeGreaterThan(25);
        expect(p.lat, `${id} ${p.id}`).toBeLessThan(60);
        expect(p.lon, `${id} ${p.id}`).toBeGreaterThan(-10);
        expect(p.lon, `${id} ${p.id}`).toBeLessThan(40);
        const { x, y } = proyectarEn(m, p.lat, p.lon);
        expect(x, `${id} ${p.id}`).toBeGreaterThan(0);
        expect(x, `${id} ${p.id}`).toBeLessThan(w);
        expect(y, `${id} ${p.id}`).toBeGreaterThan(0);
        expect(y, `${id} ${p.id}`).toBeLessThan(h);
      }
    }
    for (const id of ["gn-01", "gn-02", "gn-07", "is-18", "is-01", "is-07", "is-09", "lv-05"]) expect(idsSala()).toContain(id);
  });
  it("las otras 78 obras: sin comparativa (en este paso) y un radio por paso", () => {
    for (const id of idsSala().filter((x) => x !== "gn-01")) {
      const { radios, comparativa } = reportajePremium(id, "es");
      expect(comparativa, id).toBeNull();
      expect(radios, id).toHaveLength(recorridoSala(id)!.pasos.length);
      for (const r of radios) {
        expect(r, id).toBeGreaterThanOrEqual(0.14);
        expect(r, id).toBeLessThanOrEqual(0.36);
      }
    }
  });
  it("ids desconocidos: sin contexto, sin radios y sin comparativa", () => {
    for (const id of ["otra", "constructor", "__proto__"]) {
      expect(contextoSala(id, "es")).toBeNull();
      expect(reportajePremium(id, "es")).toEqual({ radios: [], comparativa: null });
    }
  });
  it("utilidades: contexto vacío, líneas con año y proyección del mapa", () => {
    expect(contextoVacio(null)).toBe(true);
    expect(contextoVacio({})).toBe(true);
    expect(contextoVacio({ cita: "x" })).toBe(false);
    expect(partirLinea("1535. Herry de Patenir.")).toEqual({ anio: "1535", resto: "Herry de Patenir." });
    expect(partirLinea("Hacia 1541. Se pinta.")).toEqual({ anio: "Hacia 1541", resto: "Se pinta." });
    expect(partirLinea("Sin año")).toEqual({ anio: "", resto: "Sin año" });
    expect(partirLinea("Between 1754 and 1756. Texto.")).toEqual({ anio: "Between 1754 and 1756", resto: "Texto." });
    for (const p of contextoSala("gn-01", "es")!.mapa!) {
      const { x, y } = proyectar(p.lat, p.lon);
      expect(x).toBeGreaterThan(0);
      expect(x).toBeLessThan(CAJA_MAPA.w);
      expect(y).toBeGreaterThan(0);
      expect(y).toBeLessThan(CAJA_MAPA.h);
    }
    expect(SILUETA.length).toBeGreaterThan(10);
  });

  it("el marco se ajusta a los puntos: todos proyectan dentro de su caja, también una sola ciudad", () => {
    const casos: Record<string, { lat: number; lon: number }[]> = {
      "gn-01": contextoSala("gn-01", "es")!.mapa!,
      siena: [{ lat: 43.32, lon: 11.33 }],
      roma_nuremberg: [{ lat: 41.9, lon: 12.5 }, { lat: 49.45, lon: 11.08 }],
      jerusalen: [{ lat: 31.78, lon: 35.22 }],
      estambul_alejandria: [{ lat: 41.01, lon: 28.98 }, { lat: 31.2, lon: 29.92 }],
      limoges_londres: [{ lat: 45.83, lon: 1.26 }, { lat: 51.51, lon: -0.13 }],
    };
    for (const [nombre, pts] of Object.entries(casos)) {
      const m = marcoDe(pts);
      const { w, h } = cajaDe(m);
      for (const p of pts) {
        const { x, y } = proyectarEn(m, p.lat, p.lon);
        expect(x, nombre).toBeGreaterThan(0);
        expect(x, nombre).toBeLessThan(w);
        expect(y, nombre).toBeGreaterThan(0);
        expect(y, nombre).toBeLessThan(h);
      }
      expect(w / h, nombre).toBeGreaterThanOrEqual(0.75);
      expect(w / h, nombre).toBeLessThanOrEqual(1.55);
    }
  });
  it("gn-01 conserva el marco neerlandés y una ciudad suelta se ve en contexto regional", () => {
    const m = marcoDe(contextoSala("gn-01", "es")!.mapa!);
    expect(esMarcoNeerlandes(m)).toBe(true);
    expect(cajaDe(m)).toEqual(CAJA_MAPA);
    const gn = contextoSala("gn-01", "es")!.mapa![0]!;
    expect(proyectarEn(m, gn.lat, gn.lon)).toEqual(proyectar(gn.lat, gn.lon));
    const siena = marcoDe([{ lat: 43.32, lon: 11.33 }]);
    expect(esMarcoNeerlandes(siena)).toBe(false);
    expect(siena.latMax - siena.latMin).toBeGreaterThanOrEqual(7);
    const { x, y } = proyectarEn(siena, 43.32, 11.33);
    const { w, h } = cajaDe(siena);
    expect(Math.abs(x - w / 2)).toBeLessThan(2);
    expect(Math.abs(y - h / 2)).toBeLessThan(2);
  });
  it("la silueta euro-mediterránea se recorta al marco y el mar interior solo aparece si lo toca", () => {
    const roma = siluetaEuropa(marcoDe([{ lat: 41.9, lon: 12.5 }]));
    expect(roma.tierra.length).toBeGreaterThan(0);
    expect(roma.mares).toHaveLength(0);
    const estambul = siluetaEuropa(marcoDe([{ lat: 41.01, lon: 28.98 }]));
    expect(estambul.mares).toHaveLength(1);
  });
});
