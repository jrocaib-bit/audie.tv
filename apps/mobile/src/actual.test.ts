import { describe, expect, it } from "vitest";
import { episodioAMedias, parseEpisodioActual } from "./actual";

describe("episodio actual", () => {
  it("valida el id guardado y cae en el de por defecto", () => {
    expect(parseEpisodioActual("gn-02", ["gn-01", "gn-02"], "gn-01")).toBe("gn-02");
    expect(parseEpisodioActual('"gn-02"', ["gn-01", "gn-02"], "gn-01")).toBe("gn-02");
    expect(parseEpisodioActual("zz-99", ["gn-01"], "gn-01")).toBe("gn-01");
    expect(parseEpisodioActual(null, ["gn-01"], null)).toBeNull();
    expect(parseEpisodioActual(42, ["gn-01"], "gn-01")).toBe("gn-01");
  });
  it("elige el episodio a medias más reciente", () => {
    const eps = {
      "gn-01": { positionSeconds: 10, updatedAt: "2026-11-01T00:00:00Z", completed: false },
      "gn-02": { positionSeconds: 50, updatedAt: "2026-11-05T00:00:00Z", completed: false },
      "gn-03": { positionSeconds: 90, updatedAt: "2026-11-09T00:00:00Z", completed: true },
      "gn-04": { positionSeconds: 0, updatedAt: "2026-11-10T00:00:00Z", completed: false },
    };
    expect(episodioAMedias(eps)).toBe("gn-02");
    expect(episodioAMedias(eps, "gn-02")).toBe("gn-01");
    expect(episodioAMedias({})).toBeNull();
  });
});
