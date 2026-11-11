import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PaywallWeb } from "./paywall-web";

describe("paywall web", () => {
  it("con el flag apagado no muestra fechas ni 12,99 €", () => {
    const html = renderToStaticMarkup(<PaywallWeb lang="es" lanzamiento={false} />);
    expect(html).toContain("7 días gratis. Cancela cuando quieras.");
    expect(html).toContain("Adviento con Isaías: gratis con tu cuenta.");
    expect(html).not.toMatch(/enero|12,99/);
  });

  it("con el flag encendido las fechas quedan solo en las frases del anual", () => {
    const html = renderToStaticMarkup(<PaywallWeb lang="es" lanzamiento />);
    expect(html).toContain("Precio de lanzamiento hasta el 5 de enero");
    expect(html).toContain("Si te suscribes antes del 6 de enero, pagarás 8 € al año mientras mantengas tu suscripción activa.");
    expect(html).toContain("7 días gratis. Cancela cuando quieras.");
    expect(html).not.toContain("12,99");
    const sinFrases = html
      .replace("Precio de lanzamiento hasta el 5 de enero", "")
      .replace("Si te suscribes antes del 6 de enero, pagarás 8 € al año mientras mantengas tu suscripción activa.", "");
    expect(sinFrases).not.toMatch(/enero|12,99/);
  });
});
