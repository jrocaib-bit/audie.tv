import { describe, expect, it } from "vitest";
import { narracionDeDia, partesDelDia } from "./dia-detalle";
import { PROFECIAS_ID, RETOS_APP } from "./retos-app";

const NEGACION_INICIAL = /(^|[.!?]\s+)(No|Nadie|Nunca|Nada|Ni|Not|Never|Nobody|Nothing|Neither)\b/;

describe("relatos de los días (app)", () => {
  it("Profecías de la Pasión trae el relato de sus 8 días en ES y EN", () => {
    const reto = RETOS_APP.find((r) => r.id === PROFECIAS_ID);
    expect(reto?.pasos).toHaveLength(8);
    for (const paso of reto?.pasos ?? []) {
      for (const idioma of ["es", "en"] as const) {
        const parrafos = paso.narracion?.[idioma] ?? [];
        expect(parrafos.length, `${paso.episodio} ${idioma}`).toBeGreaterThanOrEqual(2);
        expect(parrafos.length, `${paso.episodio} ${idioma}`).toBeLessThanOrEqual(4);
        for (const p of parrafos) {
          expect(p.length).toBeGreaterThanOrEqual(200);
          expect(p.length).toBeLessThanOrEqual(650);
          expect(p).not.toMatch(/[;—–]/);
          expect(p).not.toMatch(NEGACION_INICIAL);
          expect(p).not.toMatch(/\bno\b[^.]{0,80}\bsino\b|\bnot\b[^.]{0,80}\bbut\b/i);
          expect(p).not.toMatch(/\b(Za|Sal|Is|Jr|Mt|Mc|Lc|Jn|Hch)\.? \d+[,:]\d+|Conferencia Episcopal/);
        }
      }
    }
  });

  it("los demás retos siguen sin relato", () => {
    for (const reto of RETOS_APP.filter((r) => r.id !== PROFECIAS_ID)) expect(reto.pasos.some((p) => p.narracion)).toBe(false);
    expect(narracionDeDia("otro", "pp-01")).toBeUndefined();
  });

  it("con relato: escuchar, título, relato y lecturas al final", () => {
    expect(partesDelDia({ narracion: ["a", "b"], referencias: [{}], relacionados: [{}], descripcion: "x" })).toEqual(["escuchar", "titulo", "relato", "lecturas"]);
    expect(partesDelDia({ narracion: ["a", "b"] })).toEqual(["escuchar", "titulo", "relato"]);
    expect(partesDelDia({ narracion: ["a", "b"], descripcion: "x" })).toEqual(["escuchar", "titulo", "relato", "lecturas"]);
  });

  it("sin relato: la ficha compacta de siempre", () => {
    expect(partesDelDia({ referencias: [{}], descripcion: "x", relacionados: [{}] })).toEqual(["titulo", "referencias", "descripcion", "relacionados"]);
    expect(partesDelDia({})).toEqual(["titulo"]);
  });
});
