import { describe, expect, it } from "vitest";
import { tiendasVisibles } from "./tiendas-app";

describe("tiendas", () => {
  it("no publica enlaces mientras las tiendas no están abiertas", () => {
    expect(tiendasVisibles(undefined)).toBeNull();
    expect(tiendasVisibles("false")).toBeNull();
    expect(tiendasVisibles("true")?.apple).toContain("apps.apple.com");
    expect(JSON.stringify(tiendasVisibles("false")) ?? "").not.toContain("placeholder.tv.audite.app");
  });
});
