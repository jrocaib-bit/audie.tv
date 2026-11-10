import { describe, expect, it, vi } from "vitest";
import { PURCHASES_ENABLED } from "./config";
import { TIENDA_DEMO, derechoLocal, lineasDePaywall, pedirCompra, restaurarCompras, type Transaccion } from "./tienda";

const ahora = Date.parse("2026-11-10T12:00:00Z");

describe("paywall de StoreKit", () => {
  it("lee el precio localizado y la semana gratis de la tienda", () => {
    const lineas = lineasDePaywall({ entorno: "tienda", tienda: TIENDA_DEMO });
    expect(lineas.map((linea) => [linea.plan, linea.precio, linea.pruebaDias, linea.origen])).toEqual([
      ["mensual", "1,99 €", 7, "tienda"],
      ["anual", "8,00 €", 7, "tienda"],
    ]);
  });

  it("usa el precio fijo solo en web y en desarrollo", () => {
    for (const entorno of ["web", "dev"] as const) {
      const lineas = lineasDePaywall({ entorno, tienda: TIENDA_DEMO });
      expect(lineas.every((linea) => linea.origen === "estatico")).toBe(true);
      expect(lineas.find((linea) => linea.plan === "anual")?.precio).toBe("8 €");
    }
    const vacia = lineasDePaywall({ entorno: "tienda", tienda: null });
    expect(vacia.every((linea) => linea.precio === "" && linea.pruebaDias === null)).toBe(true);
  });

  it("con el flag apagado no llama a requestPurchase", async () => {
    expect(PURCHASES_ENABLED).toBe(false);
    const requestPurchase = vi.fn(async () => {});
    const resultado = await pedirCompra(PURCHASES_ENABLED, TIENDA_DEMO[1]!.id, { requestPurchase });
    expect(resultado).toBe("omitida");
    expect(requestPurchase).not.toHaveBeenCalled();
  });

  it("restaura y concede el derecho solo si la transacción sigue viva", async () => {
    const viva: Transaccion = { productId: "audite.premium.anual", estado: "purchased", expira: ahora + 86_400_000, revocada: false, cuenta: "usuario-1" };
    const caducada: Transaccion = { productId: "audite.premium.mensual", estado: "purchased", expira: ahora - 1, revocada: false, cuenta: "usuario-1" };
    const restaurar = vi.fn(async () => [caducada, viva]);
    const resultado = await restaurarCompras({ restaurar }, ahora, undefined, "usuario-1");
    expect(restaurar).toHaveBeenCalledOnce();
    expect(resultado.derecho).toEqual({ activo: true, producto: "audite.premium.anual" });
    expect(derechoLocal([caducada], ahora, undefined, "usuario-1").activo).toBe(false);
    expect(derechoLocal([{ ...viva, revocada: true }], ahora, undefined, "usuario-1").activo).toBe(false);
    expect(derechoLocal([{ ...viva, cuenta: "otra" }], ahora, undefined, "usuario-1").activo).toBe(false);
    expect(derechoLocal([viva], ahora, undefined, null).activo).toBe(false);
  });
});
