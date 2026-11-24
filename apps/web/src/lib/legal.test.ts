import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const raiz = path.resolve(import.meta.dirname, "../..");
const paginas = [
  "src/components/aviso-legal.tsx",
  "src/components/privacidad.tsx",
  "src/app/[lang]/condiciones/page.tsx",
];

describe("textos legales definitivos", () => {
  it("no deja la marca de borrador en aviso, privacidad ni condiciones", () => {
    for (const pagina of paginas) {
      const texto = readFileSync(path.join(raiz, pagina), "utf8");
      expect(texto, pagina).not.toMatch(/borrador/i);
      expect(texto, pagina).toContain("Última actualización: 11 de noviembre de 2026.");
    }
  });

  it("deja el desistimiento y el precio anual con la redacción aprobada", () => {
    const condiciones = readFileSync(path.join(raiz, "src/app/[lang]/condiciones/page.tsx"), "utf8");
    expect(condiciones).toContain("Al empezar a escuchar durante el periodo de suscripción aceptas que el contenido digital se te preste de inmediato y reconoces que pierdes el derecho de desistimiento (art. 103.m TRLGDCU). Durante los 7 días de prueba puedes cancelar sin coste.");
    expect(condiciones).toContain("Si te suscribes al plan anual antes del 6 de enero de 2027, pagarás 8 € al año mientras mantengas tu suscripción activa. A partir del 6 de enero de 2027, el plan anual cuesta 12,99 € para nuevas suscripciones.");
    expect(condiciones).not.toMatch(/cancelas y vuelves|si cancelas y vuelves/i);
  });
});
