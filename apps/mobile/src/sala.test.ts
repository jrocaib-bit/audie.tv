import { describe, expect, it } from "vitest";
import {
  ZOOM_MAX,
  ZOOM_MIN,
  fichaMuseoObra,
  limitarDesplazamiento,
  limitarZoom,
  seleccionarObraSala,
  tamanoObraSala,
} from "./sala";

describe("seleccionarObraSala", () => {
  it("devuelve gn-01 con invitación a escuchar cuando no hay episodio ni historial", () => {
    expect(
      seleccionarObraSala({
        currentEpisodeId: "gn-01",
        jugando: false,
        cargadoId: null,
        tieneActualGuardado: false,
        episodes: {},
      }),
    ).toEqual({ episodioId: "gn-01", sinEpisodio: true });

    expect(
      seleccionarObraSala({
        currentEpisodeId: null,
        jugando: false,
        cargadoId: null,
        tieneActualGuardado: false,
        episodes: {},
      }),
    ).toEqual({ episodioId: "gn-01", sinEpisodio: true });
  });

  it("muestra el episodio actual cuando está sonando, cargado o guardado", () => {
    expect(
      seleccionarObraSala({
        currentEpisodeId: "gn-01",
        jugando: true,
        cargadoId: "gn-01",
        tieneActualGuardado: true,
        episodes: {},
      }),
    ).toEqual({ episodioId: "gn-01", sinEpisodio: false });

    expect(
      seleccionarObraSala({
        currentEpisodeId: "gn-07",
        jugando: false,
        cargadoId: null,
        tieneActualGuardado: true,
        episodes: {},
      }),
    ).toEqual({ episodioId: "gn-07", sinEpisodio: false });
  });

  it("actualiza a otro episodio al cambiar el actual del reproductor", () => {
    const primero = seleccionarObraSala({
      currentEpisodeId: "gn-03",
      jugando: true,
      cargadoId: "gn-03",
      tieneActualGuardado: true,
      episodes: {},
    });
    const segundo = seleccionarObraSala({
      currentEpisodeId: "gn-14",
      jugando: true,
      cargadoId: "gn-14",
      tieneActualGuardado: true,
      episodes: {},
    });
    expect(primero.episodioId).toBe("gn-03");
    expect(segundo.episodioId).toBe("gn-14");
  });

  it("cae al último episodio escuchado si no hay actual activo", () => {
    expect(
      seleccionarObraSala({
        currentEpisodeId: null,
        jugando: false,
        cargadoId: null,
        tieneActualGuardado: false,
        episodes: {
          "gn-01": { positionSeconds: 524, updatedAt: "2026-11-18T10:00:00Z", completed: true },
          "gn-09": { positionSeconds: 120, updatedAt: "2026-11-20T18:30:00Z", completed: false },
          "gn-04": { positionSeconds: 0, updatedAt: "2026-11-20T19:00:00Z", completed: false },
        },
        validos: ["gn-01", "gn-04", "gn-09"],
      }),
    ).toEqual({ episodioId: "gn-09", sinEpisodio: false });
  });
});

describe("fichaMuseoObra", () => {
  it("lee título, autor, fecha y ubicación reales de visibles.json en ES y EN", () => {
    const es = fichaMuseoObra("gn-01", "es");
    expect(es.titulo).toBe("El paraíso");
    expect(es.autor).toBe("Herri met de Bles");
    expect(es.fecha).toBe("c. 1541–1550");
    expect(es.ubicacion).toBe("Rijksmuseum, Ámsterdam");
    expect(es.ratio).toBeCloseTo(960 / 540, 4);

    const en = fichaMuseoObra("gn-03", "en");
    expect(en.titulo).toBe("The Entry of the Animals into Noah’s Ark");
    expect(en.autor).toBe("Jan Brueghel the Elder");
    expect(en.fecha).toBe("1613");
    expect(en.ubicacion).toBe("J. Paul Getty Museum, Los Angeles");
  });

  it("omite campos faltantes o pendientes sin inventar museos ni fechas", () => {
    const sinUbicacion = fichaMuseoObra("dt-07", "es");
    expect(sinUbicacion.titulo).toBeTruthy();
    expect(sinUbicacion.ubicacion).toBe("");

    const sinFecha = fichaMuseoObra("jos-11", "es");
    expect(sinFecha.titulo).toBeTruthy();
    expect(sinFecha.fecha).toBe("");

    const pendiente = fichaMuseoObra("test", "es", null, () => ({
      id: "x",
      episodio: "test",
      libro: "gn",
      numero: 1,
      capitulos: "Gn 1",
      titulo: { es: "Título", en: "Title" },
      autor: { es: "PENDIENTE", en: "PENDIENTE" },
      fecha: "PENDIENTE",
      ubicacion: { es: "", en: "" },
      placa: { es: "", en: "" },
      escena: { es: "", en: "" },
      ancho: 800,
      alto: 1000,
      licencia: "",
      fuente_url: "",
      credito_completo: false,
    }));
    expect(pendiente.titulo).toBe("Título");
    expect(pendiente.autor).toBe("");
    expect(pendiente.fecha).toBe("");
    expect(pendiente.ubicacion).toBe("");
  });
});

describe("tamanoObraSala y zoom", () => {
  it("mantiene la proporción original entera para obras horizontales y verticales", () => {
    const horiz = tamanoObraSala(960 / 608, 340, 380);
    expect(horiz.width).toBe(340);
    expect(horiz.width / horiz.height).toBeCloseTo(960 / 608, 1);

    const vert = tamanoObraSala(960 / 1193, 340, 380);
    expect(vert.height).toBe(380);
    expect(vert.width).toBeLessThan(340);
    expect(vert.width / vert.height).toBeCloseTo(960 / 1193, 1);
  });

  it("limita zoom y desplazamiento dentro de los bordes de la obra", () => {
    expect(limitarZoom(0.4)).toBe(ZOOM_MIN);
    expect(limitarZoom(9)).toBe(ZOOM_MAX);
    expect(limitarZoom(2.5)).toBe(2.5);

    expect(limitarDesplazamiento(100, -100, 1, 300, 200)).toEqual({ x: 0, y: 0 });
    expect(limitarDesplazamiento(500, -500, 2, 300, 200)).toEqual({ x: 150, y: -100 });
  });
});
