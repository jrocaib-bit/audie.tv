import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { lineaIdiomas } from "./idiomas-linea";

describe("idiomas", () => {
  it("no promete siete idiomas", () => {
    expect(lineaIdiomas("es")).toBe("Disponible en español; más idiomas pronto.");
    expect(lineaIdiomas("en")).not.toMatch(/seven languages/i);
    const sitio = readFileSync(new URL("../../../content/sitio/es.json", import.meta.url), "utf8");
    expect(sitio).not.toContain("7 idiomas");
    expect(sitio).not.toContain("\"faqLangA\": \"Siete.\"");
  });
});
