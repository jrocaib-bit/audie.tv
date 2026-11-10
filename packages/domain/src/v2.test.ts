import { describe, expect, it } from "vitest";
import {
  añadirALista,
  buscar,
  codigoSala,
  codigoValido,
  crearLista,
  enlaceProfundo,
  estantes,
  fundidoMs,
  mixesDeHora,
  momento,
  portadaLista,
  reordenarLista,
  resumenAnio,
  siguienteEnCola,
} from "./v2";

describe("inicio", () => {
  it("cambia el mix con la hora y el día", () => {
    expect(momento(8)).toBe("manana");
    expect(momento(15)).toBe("tarde");
    expect(momento(21)).toBe("noche");
    const a = mixesDeHora(9, 1, "es").find((mix) => mix.id === "mix-hoy");
    const b = mixesDeHora(9, 2, "es").find((mix) => mix.id === "mix-hoy");
    expect(a?.episodioId).not.toBe(b?.episodioId);
  });

  it("filtra estanterías sin vaciar Hecho para ti", () => {
    const base = {
      locale: "es" as const,
      hora: 9,
      diaDelAno: 3,
      escuchados: [{ id: "gn-01", titulo: "En el principio" }],
      camino: [{ id: "gn-01", titulo: "En el principio" }],
      libros: [{ id: "gn", titulo: "Génesis" }],
    };
    expect(estantes({ ...base, filtro: "todo" }).map((estante) => estante.id)).toContain("hora");
    expect(estantes({ ...base, filtro: "temas" }).map((estante) => estante.id)).toEqual(["temas", "personajes"]);
    expect(estantes({ ...base, filtro: "libros" })[0]?.tarjetas[0]?.href).toBe("/libro/gn");
  });
});

describe("buscar y cola", () => {
  it("entiende un pasaje y agrupa el resto", () => {
    const resultado = buscar("Jn 3,16", "es");
    expect(resultado.pasaje).toMatchObject({ libroId: "jn", capitulo: 3, versiculo: 16 });
    expect(buscar("david", "es").personajes.map((persona) => persona.id)).toContain("david");
    expect(buscar("", "es").temas.length).toBeGreaterThan(0);
  });

  it("sigue la cola y funde si hay movimiento", () => {
    expect(siguienteEnCola(["a", "b", "c"], "b")).toBe("c");
    expect(siguienteEnCola(["a"], "a")).toBeNull();
    expect(fundidoMs(false)).toBeGreaterThan(0);
    expect(fundidoMs(true)).toBe(0);
  });
});

describe("año, listas y sala", () => {
  it("resume el año con la racha y el versículo que más vuelve", () => {
    const resumen = resumenAnio({
      segundos: 120,
      libros: ["gn", "gn", "sal"],
      dias: ["2026-11-07", "2026-11-08", "2026-11-09"],
      hoy: "2026-11-09",
      versiculos: ["1:1", "1:1", "3:16"],
    });
    expect(resumen).toMatchObject({ minutos: 2, libros: 2, racha: 3, versiculo: "1:1" });
  });

  it("crea un enlace al segundo y una lista con portada", () => {
    expect(enlaceProfundo("gn-01", 12.8, "es").app).toBe("audite://escuchar/gn-01?t=12");
    expect(enlaceProfundo("gn-01", 12.8, "es").web).toBe("/es/oir/gn-01?t=12");
    const lista = crearLista("  Mis pasajes ", "ahora", "l1");
    expect(lista?.nombre).toBe("Mis pasajes");
    const con = añadirALista(lista!, "gn-01", "ahora");
    const otra = añadirALista(añadirALista(con, "sal-01", "ahora"), "gn-01", "ahora");
    expect(otra.items.map((item) => item.episodeId)).toEqual(["gn-01", "sal-01"]);
    expect(portadaLista(reordenarLista(otra, 0, 1))[0]).toBe("sal-01");
    expect(crearLista("   ", "ahora", "x")).toBeNull();
  });

  it("acepta un código de sala de seis signos", () => {
    expect(codigoSala("casa")).toHaveLength(6);
    expect(codigoValido(codigoSala("casa"))).toBe(true);
    expect(codigoValido("no")).toBe(false);
  });
});
