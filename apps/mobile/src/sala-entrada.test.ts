import { beforeEach, describe, expect, it } from "vitest";
import { debeLanzarEntradaSala, debeMostrarEntradaSala, entradaYaVistaEnSesion, marcarEntradaVista, reiniciarEntradasVistasSesion } from "./sala-cuenta";
import { espacioDeEpisodio } from "./sala-espacios";
import { resolverLugarObra } from "./sala-lugares";
import { decidirVuelo, planDeVuelo, vueloDeSede, vueloEnVivoHabilitado } from "./sala-vuelo";

describe("entrada de La sala: una vez por obra y sesión", () => {
  beforeEach(() => reiniciarEntradasVistasSesion());

  it("lanza una obra nueva y no repite la misma tras marcarla", () => {
    expect(debeLanzarEntradaSala(true, "is-16")).toBe(true);
    marcarEntradaVista("is-16");
    expect(entradaYaVistaEnSesion("is-16")).toBe(true);
    expect(debeLanzarEntradaSala(true, "is-16")).toBe(false);
    expect(debeLanzarEntradaSala(true, "gn-01")).toBe(true);
  });

  it("no lanza sin permiso ni sin id", () => {
    expect(debeLanzarEntradaSala(false, "is-16")).toBe(false);
    expect(debeLanzarEntradaSala(true, null)).toBe(false);
    expect(debeLanzarEntradaSala(true, undefined)).toBe(false);
    expect(debeLanzarEntradaSala(true, "")).toBe(false);
  });

  it("acepta un conjunto de vistas propio", () => {
    expect(debeLanzarEntradaSala(true, "a", new Set(["a"]))).toBe(false);
    expect(debeLanzarEntradaSala(true, "b", new Set(["a"]))).toBe(true);
  });

  it("reiniciar vacía la memoria de la sesión", () => {
    marcarEntradaVista("is-16");
    reiniciarEntradasVistasSesion();
    expect(entradaYaVistaEnSesion("is-16")).toBe(false);
  });

  it("el permiso sigue siendo sesión y sin reducir movimiento", () => {
    expect(debeMostrarEntradaSala({ userId: "u" }, false)).toBe(true);
    expect(debeMostrarEntradaSala(null, false)).toBe(false);
    expect(debeMostrarEntradaSala({ userId: "u" }, true)).toBe(false);
  });
});

describe("vuelo: sede, flag y coordenadas", () => {
  const base = { clave: "k", reducir: false, soportado: true, fallido: false, habilitado: true };

  it("met sigue en v2 y bonnefanten en vivo con clave", () => {
    expect(decidirVuelo({ ...base, sede: "met" })).toBe("v2");
    expect(decidirVuelo({ ...base, sede: "bonnefanten" })).toBe("vivo");
  });

  it("con el flag apagado todo es v2", () => {
    expect(decidirVuelo({ ...base, sede: "bonnefanten", habilitado: false })).toBe("v2");
  });

  it("lee EXPO_PUBLIC_SALA_VUELO_VIVO", () => {
    expect(vueloEnVivoHabilitado({})).toBe(true);
    expect(vueloEnVivoHabilitado({ EXPO_PUBLIC_SALA_VUELO_VIVO: "1" })).toBe(true);
    for (const v of ["0", "false", "off", " OFF ", "False"]) {
      expect(vueloEnVivoHabilitado({ EXPO_PUBLIC_SALA_VUELO_VIVO: v }), v).toBe(false);
    }
  });

  it("is-16 vive en The Met, con sus coordenadas", () => {
    const esp = espacioDeEpisodio("is-16");
    expect(esp.sede).toBe("met");
    const lugar = resolverLugarObra("", "is-16", undefined, esp.sede ?? undefined);
    expect(lugar.lat).toBeCloseTo(40.77944, 4);
    expect(lugar.lon).toBeCloseTo(-73.96333, 4);
  });

  it("sin sede no hay plan de vuelo", () => {
    expect(vueloDeSede("sin-sede" as never)).toBeNull();
    expect(planDeVuelo("sin-sede" as never)).toBeNull();
  });
});
