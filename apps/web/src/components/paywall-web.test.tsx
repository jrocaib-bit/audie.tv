import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PaywallWeb } from "./paywall-web";

describe("paywall web", () => {
  it("con el flag apagado muestra el precio actual y el 12,99 € como futuro", () => {
    const html = renderToStaticMarkup(<PaywallWeb lang="es" lanzamiento={false} />);
    expect(html).toContain("7 días gratis. Cancela cuando quieras.");
    expect(html).toContain("Adviento con Isaías: gratis con tu cuenta.");
    expect(html).toContain("8,00 €/año");
    expect(html).toContain("1,99 €/mes");
    expect(html).toContain("A partir del 6 de enero de 2027, las altas anuales nuevas cuestan 12,99 € al año.");
    expect(html).not.toContain("Precio de lanzamiento");
    expect(html).not.toMatch(/12,99 €\/año/);
  });

  it("la letra pequeña explica qué pasa al cancelar", () => {
    const html = renderToStaticMarkup(<PaywallWeb lang="es" lanzamiento={false} />);
    expect(html).toContain("sigues con acceso hasta que termine el periodo ya pagado");
    expect(html).toContain("se aplica la tarifa de ese momento");
    expect(html).toContain("Te escribimos cuando la app esté en las tiendas.");
  });

  it("con el flag encendido las fechas quedan solo en las frases del anual", () => {
    const html = renderToStaticMarkup(<PaywallWeb lang="es" lanzamiento />);
    expect(html).toContain("Precio de lanzamiento hasta el 5 de enero");
    expect(html).toContain("Si te suscribes antes del 6 de enero, pagarás 8 € al año mientras mantengas tu suscripción activa.");
    expect(html).toContain("7 días gratis. Cancela cuando quieras.");
    expect(html).toContain("12,99 € al año");
    expect(html).not.toMatch(/12,99 €\/año/);
  });
});
