import { describe, expect, it } from "vitest";
import { esPremium } from "./es-premium";

describe("esPremium", () => {
  it("true solo con status active", () => {
    expect(esPremium({ status: "active" })).toBe(true);
  });
  it("false por defecto", () => {
    for (const e of [undefined, null, {}, { status: null }, { status: "none" }, { status: "pending" }, { status: "inactive" }, { status: "otro" }, { status: "trialing" }, { status: "ACTIVE" }]) {
      expect(esPremium(e as { status?: string | null } | null | undefined), JSON.stringify(e)).toBe(false);
    }
  });
});
