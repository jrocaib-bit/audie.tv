import { describe, expect, it } from "vitest";
import indice from "../../../content/canon/catalogo-indice.json";
import capa from "../../../content/catalog/resumenes-estilo.json";
import { aplicarEstiloResumenes, type CapaEstilo } from "./resumenes-estilo";

type Ep = Parameters<typeof aplicarEstiloResumenes>[0];
const eps = indice.episodes as unknown as Ep;

describe("aplicarEstiloResumenes", () => {
  it("sustituye es y en con recorte de espacios y deja el resto igual", () => {
    const [a, b] = eps;
    const r = aplicarEstiloResumenes([a!, b!], { [a!.id]: { es: "  Nuevo  ", en: " New " } });
    expect(r[0]!.summary).toEqual({ es: "Nuevo", en: "New" });
    expect(r[1]).toBe(b);
    expect(r[0]!.id).toBe(a!.id);
  });
  it("si solo hay un idioma conserva el otro del catálogo", () => {
    const a = eps[0]!;
    const r = aplicarEstiloResumenes([a], { [a.id]: { es: "Solo es" } });
    expect(r[0]!.summary?.es).toBe("Solo es");
    expect(r[0]!.summary?.en).toBe((a.summary?.en ?? "").trim());
  });
  it("no toca el catálogo con la capa real y mantiene el número de episodios", () => {
    const r = aplicarEstiloResumenes(eps, capa as CapaEstilo);
    expect(r).toHaveLength(eps.length);
    for (const e of r) if (!(e.id in capa)) expect(eps.find((x) => x.id === e.id)).toBe(e);
  });
});
