import fs from "node:fs";
import path from "node:path";
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
import audioListo from "../../../content/audio_listo.json";
import { formatearCoordenadas, inferirMedio, resolverLugarObra } from "./sala-lugares";
import { camaraDeParadas, episodiosConRecorrido, paradasDeEpisodio, recorridoCrudo } from "./sala-recorrido";

describe("sala-lugares", () => {
  it("resuelve sedes reales con coordenadas y arquetipo de sala sin inventar datos", () => {
    const rijks = resolverLugarObra("Rijksmuseum, Ámsterdam", "gn-01");
    expect(rijks.id).toBe("rijksmuseum");
    expect(rijks.sala).toBe("galeria-holandesa");
    expect(rijks.silueta).toBe("rijksmuseum");
    expect(rijks.coordenadasTexto).toBe("52.36° N · 4.89° E");

    const vitral = resolverLugarObra("The Metropolitan Museum of Art, Nueva York", "is-01");
    expect(vitral.sala).toBe("capilla-vitral");
    expect(vitral.silueta).toBe("capilla");
    expect(vitral.coordenadasTexto).toBe("40.78° N · 73.96° W");

    const piedra = resolverLugarObra("The Metropolitan Museum of Art, Nueva York", "lv-01");
    expect(piedra.sala).toBe("galeria-piedra");

    const estampa = resolverLugarObra("Biblioteca de John Rylands", "ex-03");
    expect(estampa.sala).toBe("gabinete-estampas");
    expect(estampa.silueta).toBe("biblioteca");

    const sinSede = resolverLugarObra("", "dt-07");
    expect(sinSede.lat).toBeNull();
    expect(sinSede.lon).toBeNull();
    expect(sinSede.coordenadasTexto).toBe("");
    expect(formatearCoordenadas(null, null)).toBe("");
    expect(inferirMedio("is-04", "")).toBe("vitral");
  });
});

describe("sala-recorrido y cobertura de los 79 episodios reproducibles", () => {
  it("cubre los 79 episodios reproducibles con pasos y textos ES/EN válidos sin notas de producción", () => {
    const reproducibles = audioListo.episodios.map((e) => e.id);
    const curados = new Set(episodiosConRecorrido());
    expect(reproducibles.length).toBe(79);

    for (const id of reproducibles) {
      expect(curados.has(id)).toBe(true);
      const r = recorridoCrudo(id);
      expect(r).not.toBeNull();
      expect(r!.apertura.titulo.es.trim().length).toBeGreaterThan(2);
      expect(r!.apertura.titulo.en.trim().length).toBeGreaterThan(2);
      expect(r!.apertura.texto.es.trim().length).toBeGreaterThan(10);
      expect(r!.apertura.texto.en.trim().length).toBeGreaterThan(10);
      expect(r!.cierre.titulo.es.trim().length).toBeGreaterThan(2);
      expect(r!.cierre.texto.en.trim().length).toBeGreaterThan(10);
      expect(r!.pasos.length).toBeGreaterThanOrEqual(4);
      expect(r!.pasos.length).toBeLessThanOrEqual(6);
      for (const paso of r!.pasos) {
        expect(paso.x).toBeGreaterThan(0);
        expect(paso.x).toBeLessThan(1);
        expect(paso.y).toBeGreaterThan(0);
        expect(paso.y).toBeLessThan(1);
        expect(paso.zoom).toBeGreaterThanOrEqual(1.4);
        expect(paso.zoom).toBeLessThanOrEqual(3.5);
        expect(paso.titulo.es.trim().length).toBeGreaterThan(1);
        expect(paso.titulo.en.trim().length).toBeGreaterThan(1);
        expect(paso.texto.es.trim().length).toBeGreaterThan(8);
        expect(paso.texto.en.trim().length).toBeGreaterThan(8);
        const combinado = `${paso.titulo.es} ${paso.texto.es} ${paso.titulo.en} ${paso.texto.en}`;
        expect(combinado).not.toMatch(/Dominio público|Public Domain|Rijksmuseum|Metropolitan Museum/i);
      }
    }
  });

  it("calcula cámara contenida en apertura/cierre y respaldo limpio en episodios sin curación", () => {
    const { paradas, curado } = paradasDeEpisodio("gn-01", "en", { tituloObra: "Paradise" });
    expect(curado).toBe(true);
    expect(paradas[0].tipo).toBe("apertura");
    expect(paradas[paradas.length - 1].tipo).toBe("cierre");

    const frames = camaraDeParadas(paradas, 352, 198, 390, 700);
    expect(frames[0]).toEqual({ scale: 1, tx: 0, ty: 0, salaOpacity: 1, puntosOpacity: 1 });
    expect(frames[frames.length - 1]).toEqual({ scale: 1, tx: 0, ty: 0, salaOpacity: 1, puntosOpacity: 0.65 });
    expect(frames[1].scale).toBeGreaterThan(1.5);
    expect(frames[1].salaOpacity).toBeLessThan(0.5);

    const fb = paradasDeEpisodio("ep-inexistente", "es", { tituloObra: "Obra", resumen: "Resumen." });
    expect(fb.curado).toBe(false);
    expect(fb.paradas).toHaveLength(2);
  });
});

import { CREDITOS_EDIFICIOS, ESPACIOS_GEOMETRIA as ESPACIOS, SEDES_VIAJE, componerSala, espacioDeEpisodio, episodiosConEspacio } from "./sala-espacios";

describe("sala v2: espacios reales y composición", () => {
  it("cada episodio tiene sede, sala y medio con assets", () => {
    const eps = episodiosConEspacio();
    expect(eps.length).toBe(79);
    for (const ep of eps) {
      const e = espacioDeEpisodio(ep);
      expect(ESPACIOS[e.espacio]).toBeTruthy();
      expect(SEDES_VIAJE.some((v) => v.id === (e.sede ?? "sin-lugar"))).toBe(true);
    }
  });

  it("pilotos: gn-01 Rijksmuseum, is-01 vitral del Met en ventana, is-03 pintura del Met", () => {
    expect(espacioDeEpisodio("gn-01")).toMatchObject({ sede: "rijksmuseum", espacio: "rijksmuseum-pintura", medio: "pintura" });
    expect(espacioDeEpisodio("is-01")).toMatchObject({ sede: "met", espacio: "met-vitral", medio: "vitral", galeria: "502" });
    expect(espacioDeEpisodio("is-03")).toMatchObject({ sede: "met", espacio: "met-pintura", galeria: "537" });
    expect(espacioDeEpisodio("is-02").sede).toBe("cloisters");
    expect(ESPACIOS["met-vitral"].tipo).toBe("ventana");
  });

  it("los assets existen y pesan poco (WebP/MP4)", () => {
    const base = path.resolve(__dirname, "../assets/sala");
    let total = 0;
    for (const v of SEDES_VIAJE) {
      for (const f of [`viaje/${v.id}.mp4`, `viaje/${v.id}-inicio.webp`, `viaje/${v.id}-final.webp`, ...(v.edificio ? [`edificios/${v.id}.webp`] : [])]) {
        expect(fs.existsSync(path.join(base, f))).toBe(true);
        total += fs.statSync(path.join(base, f)).size;
      }
    }
    for (const id of Object.keys(ESPACIOS)) {
      const f = path.join(base, `salas/${id}.webp`);
      expect(fs.existsSync(f)).toBe(true);
      total += fs.statSync(f).size;
    }
    expect(total).toBeLessThan(8 * 1024 * 1024);
  });

  it("las sedes con fachada tienen atribución en Créditos", () => {
    const conFachada = SEDES_VIAJE.filter((v) => v.edificio).map((v) => v.id);
    for (const sede of conFachada) expect(CREDITOS_EDIFICIOS.some((c) => c.sede === sede && c.licencia && c.url.startsWith("https://commons.wikimedia.org/"))).toBe(true);
    for (const c of CREDITOS_EDIFICIOS) expect(["CC0", "CC BY 2.0", "Dominio público"]).toContain(c.licencia);
  });

  it("la obra entra entera en su pared/ventana y la sala cubre el escenario", () => {
    const stageW = 390;
    const stageH = 700;
    const centroY = Math.round(stageH * 0.38);
    for (const espacio of Object.values(ESPACIOS)) {
      for (const ratio of [0.32, 0.69, 1, 1.78]) {
        const medio = espacio.tipo === "ventana" ? "vitral" : "pintura";
        const r = componerSala({ espacio, medio, ratio, stageW, stageH, centroY, maxAncho: 328, maxAlto: 350 });
        expect(Math.abs(r.obra.width / r.obra.height - ratio) / ratio).toBeLessThan(0.05);
        expect(r.obra.width).toBeLessThanOrEqual(330);
        expect(r.obra.height).toBeLessThanOrEqual(352);
        expect(r.sala.left).toBeLessThanOrEqual(1);
        expect(r.sala.top).toBeLessThanOrEqual(1);
        expect(r.sala.left + r.sala.width).toBeGreaterThanOrEqual(stageW - 1);
        expect(r.sala.top + r.sala.height).toBeGreaterThanOrEqual(stageH - 1);
        const a = espacio.ancla;
        const x0 = r.sala.left + a.x0 * r.sala.width;
        const x1 = r.sala.left + a.x1 * r.sala.width;
        const y0 = r.sala.top + a.y0 * r.sala.height;
        const y1 = r.sala.top + a.y1 * r.sala.height;
        const ow = r.obra.width + 2 * r.marco;
        const oh = r.obra.height + 2 * r.marco;
        expect(stageW / 2 - ow / 2).toBeGreaterThanOrEqual(x0 - 2);
        expect(stageW / 2 + ow / 2).toBeLessThanOrEqual(x1 + 2);
        expect(centroY - oh / 2).toBeGreaterThanOrEqual(y0 - 2);
        expect(centroY + oh / 2).toBeLessThanOrEqual(y1 + 2);
        expect(r.entrada.scale).toBeGreaterThan(0);
        expect(r.entrada.scale).toBeLessThanOrEqual(1);
      }
    }
  });
});
