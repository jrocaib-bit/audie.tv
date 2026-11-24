import { describe, expect, it } from "vitest";
import { emptyProgress, recordListen } from "@audite/domain";
import { ultimoEpisodioEscuchado } from "./sala-escuchando";

describe("ultimoEpisodioEscuchado", () => {
  it("devuelve el de updatedAt más reciente", () => {
    let p = emptyProgress();
    p = recordListen(p, "gn-01", 10, 100, "paused", "2026-11-01T10:00:00.000Z");
    p = recordListen(p, "is-18", 20, 100, "paused", "2026-11-24T18:00:00.000Z");
    p = recordListen(p, "gn-07", 5, 100, "paused", "2026-11-20T12:00:00.000Z");
    expect(ultimoEpisodioEscuchado(p)).toBe("is-18");
    expect(ultimoEpisodioEscuchado(emptyProgress())).toBeNull();
  });
});
