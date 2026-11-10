import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const es = JSON.parse(readFileSync(new URL("../../../content/sitio/es.json", import.meta.url), "utf8")) as { homeTitle: string; homeCta: string; ctaGhost: string; ctaRisk: string };
const en = JSON.parse(readFileSync(new URL("../../../content/sitio/en.json", import.meta.url), "utf8")) as { homeTitle: string; homeCta: string };
const borrador = JSON.parse(readFileSync(new URL("../../../content/sitio/borrador.json", import.meta.url), "utf8")) as Record<string, { homeTitle?: string; homeCta?: string }>;

describe("cta de conversión", () => {
  it("usa el mismo arranque de siete días en los siete idiomas", () => {
    expect(es.homeTitle.split("\n")).toEqual(["La Biblia,", "de principio", "a fin."]);
    expect(en.homeTitle.split("\n")).toEqual(["The Bible,", "from beginning", "to end."]);
    for (const idioma of ["it", "pt", "fr", "de", "zh"]) {
      expect(borrador[idioma]?.homeTitle?.split("\n")).toHaveLength(3);
    }
    expect(es.homeCta).toBe("Empieza 7 días gratis");
    expect(en.homeCta).toBe("Start 7 days free");
    expect(es.ctaGhost).toContain("Apple");
    expect(es.ctaGhost).toContain("Google");
    expect(es.ctaRisk.length).toBeGreaterThan(0);
    for (const idioma of ["it", "pt", "fr", "de", "zh"]) {
      expect(borrador[idioma]?.homeCta).toMatch(/7/);
    }
  });
});
