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

    // gn-01: sede nueva (la sede se fuerza con sedeId; la cartela del Rijksmuseum no la cambia).
    const bonne = resolverLugarObra("Rijksmuseum, Ámsterdam", "gn-01", undefined, "bonnefanten");
    expect(bonne.id).toBe("bonnefanten");
    expect(bonne.ciudad.es).toBe("Maastricht");
    expect(bonne.edificio.es).toBe("Bonnefantenmuseum");
    expect(bonne.coordenadasTexto).toBe("50.84° N · 5.70° E");

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

  it("pilotos: gn-01 Bonnefantenmuseum (préstamo del Rijksmuseum), is-01 vitral del Met en ventana, is-03 pintura del Met", () => {
    expect(espacioDeEpisodio("gn-01")).toMatchObject({ sede: "bonnefanten", espacio: "bonnefanten-sala", medio: "pintura" });
    // El resto de episodios del Rijksmuseum se quedan en Ámsterdam.
    expect(episodiosConEspacio().filter((e) => e !== "gn-01").some((e) => espacioDeEpisodio(e).sede === "rijksmuseum")).toBe(true);
    expect(episodiosConEspacio().filter((e) => espacioDeEpisodio(e).sede === "bonnefanten")).toEqual(["gn-01"]);
    expect(espacioDeEpisodio("is-01")).toMatchObject({ sede: "met", espacio: "met-vitral", medio: "vitral", galeria: "502" });
    expect(espacioDeEpisodio("is-03")).toMatchObject({ sede: "met", espacio: "met-pintura", galeria: "537" });
    expect(espacioDeEpisodio("is-02").sede).toBe("cloisters");
    expect(ESPACIOS["met-vitral"].tipo).toBe("ventana");
  });

  it("los assets existen y pesan poco (WebP/MP4)", () => {
    const base = path.resolve(__dirname, "../assets/sala");
    let total = 0;
    for (const v of SEDES_VIAJE) {
      for (const f of [`viaje/${v.recurso}.mp4`, `viaje/${v.recurso}-inicio.webp`, `viaje/${v.recurso}-final.webp`, ...(v.edificio ? [`edificios/${v.id}.webp`] : [])]) {
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
    for (const c of CREDITOS_EDIFICIOS) expect(["CC0", "CC BY 2.0", "CC BY 4.0", "Dominio público"]).toContain(c.licencia);
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

import { HTML_VUELO, CESIUM_VERSION } from "./sala-vuelo-html";
import {
  CAMARAS_SEDE,
  DURACION_VUELO_MS,
  SEDES_VUELO_VIVO,
  claveMapTiles,
  decidirVuelo,
  leerMensajeVuelo,
  planDeVuelo,
  scriptInyeccionVuelo,
  sinClave,
  tiemposVueloVivo,
  vueloDeSede,
} from "./sala-vuelo";
import { MASCARAS_OBRA, mascaraDeObra, obraCompleta, type SedeId } from "./sala-espacios";

const SEDES_TODAS: SedeId[] = ["bonnefanten", "rijksmuseum", "met", "cloisters", "getty", "nga", "cleveland", "berlin", "varsovia", "londres", "chicago", "rylands"];

describe("sala v3: vuelo en vivo (Google 3D Tiles)", () => {
  it("todas las sedes tienen coordenadas y keyframes de cámara coherentes (rango decreciente, espacio -> edificio)", () => {
    for (const id of SEDES_TODAS) {
      const v = vueloDeSede(id);
      expect(v, id).not.toBeNull();
      const k = v!.keyframes;
      expect(k.length).toBeGreaterThanOrEqual(4);
      expect(k[0].rango).toBeGreaterThan(1_000_000);
      expect(k[k.length - 1].rango).toBeLessThan(1000);
      for (let i = 1; i < k.length; i++) expect(k[i].rango, `${id}[${i}]`).toBeLessThan(k[i - 1].rango);
      expect(k[k.length - 1].lat).toBeCloseTo(v!.lat, 5);
      expect(k[k.length - 1].lon).toBeCloseTo(v!.lon, 5);
    }
  });

  it("Bonnefanten: Avenue Céramique, Maastricht, con cámara propia", () => {
    const v = vueloDeSede("bonnefanten")!;
    expect(v.lat).toBeCloseTo(50.842529, 3);
    expect(v.lon).toBeCloseTo(5.701984, 3);
    expect(CAMARAS_SEDE.bonnefanten).toBeTruthy();
    expect(planDeVuelo("bonnefanten")?.duracion).toBe(DURACION_VUELO_MS);
  });

  it("decide vuelo en vivo solo con clave, sede activa, sin «reducir movimiento» y sin fallo previo", () => {
    const base = { clave: "k", reducir: false, sede: "bonnefanten" as const, soportado: true, fallido: false };
    expect(SEDES_VUELO_VIVO).toContain("bonnefanten");
    expect(decidirVuelo(base)).toBe("vivo");
    expect(decidirVuelo({ ...base, clave: "" })).toBe("v2");
    expect(decidirVuelo({ ...base, reducir: true })).toBe("v2");
    expect(decidirVuelo({ ...base, fallido: true })).toBe("v2");
    expect(decidirVuelo({ ...base, soportado: false })).toBe("v2");
    expect(decidirVuelo({ ...base, sede: null })).toBe("v2");
    expect(decidirVuelo({ ...base, sede: "rijksmuseum" })).toBe("v2");
  });

  it("el HTML empaquetado no lleva clave y fija la versión de Cesium; la clave solo viaja inyectada", () => {
    expect(CESIUM_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    expect(HTML_VUELO).toContain(`cesium@${CESIUM_VERSION}`);
    expect(HTML_VUELO).not.toMatch(/AIza[0-9A-Za-z_-]{20,}/);
    expect(HTML_VUELO).toContain("showCreditsOnScreen:true");
    expect(HTML_VUELO).toContain("window.__AUDITE_CLAVE");
    const plan = planDeVuelo("bonnefanten")!;
    const inyeccion = scriptInyeccionVuelo("clave-de-prueba", plan);
    expect(inyeccion).toContain('window.__AUDITE_CLAVE="clave-de-prueba"');
    expect(HTML_VUELO).not.toContain("clave-de-prueba");
  });

  it("claveMapTiles lee EXPO_PUBLIC_GOOGLE_MAPS_API_KEY y vale vacío si falta", () => {
    expect(claveMapTiles({})).toBe("");
    expect(claveMapTiles({ EXPO_PUBLIC_GOOGLE_MAPS_API_KEY: "  abc " })).toBe("abc");
  });

  it("los mensajes de la WebView no arrastran claves y los desconocidos se ignoran", () => {
    expect(sinClave("https://tile.googleapis.com/v1/3dtiles/root.json?key=SECRETA&x=1")).toBe("https://tile.googleapis.com/v1/3dtiles/root.json?key=REDACTED&x=1");
    expect(leerMensajeVuelo('{"tipo":"listo"}')).toEqual({ tipo: "listo", motivo: undefined });
    expect(leerMensajeVuelo('{"tipo":"error","motivo":"root?key=SECRETA"}')?.motivo).toBe("root?key=REDACTED");
    expect(leerMensajeVuelo('{"tipo":"otro"}')).toBeNull();
    expect(leerMensajeVuelo("no es json")).toBeNull();
    expect(leerMensajeVuelo(42)).toBeNull();
  });

  it("la entrada en vivo reserva el tramo final para revelar la sala", () => {
    const t = tiemposVueloVivo();
    expect(t.salaIn).toBeLessThan(DURACION_VUELO_MS);
    expect(t.total).toBeGreaterThan(DURACION_VUELO_MS);
  });
});

describe("sala v3: gn-01 en el Bonnefanten con el tondo entero", () => {
  it("usa la imagen completa del tondo (no el recorte 16:9) con máscara circular solo para quitar el fondo", () => {
    const completa = obraCompleta("https://x.test/obras/gn-01_o5-detalle-960.webp");
    expect(completa).toEqual({ src: "https://x.test/obras/gn-01_o5-960.webp", ratio: 960 / 999 });
    expect(obraCompleta("https://x.test/obras/gn-02_o1-detalle-960.webp")).toBeNull();
    const m = mascaraDeObra(completa!.src)!;
    expect(m).toEqual(MASCARAS_OBRA["gn-01_o5"]);
    // El círculo envuelve la pintura entera: el radio cubre el semi-alto del tondo (492 px de 960 de ancho).
    expect(m.r * 960).toBeGreaterThanOrEqual(491.9);
    expect(m.cx - m.r).toBeLessThan(0.01);
  });

  it("el interior real del Bonnefanten aloja el tondo entero sobre un muro libre", () => {
    const e = ESPACIOS["bonnefanten-sala"];
    expect(e.tipo).toBe("pared");
    const c = componerSala({ espacio: e, medio: "pintura", ratio: 960 / 999, stageW: 390, stageH: 700, centroY: 266, maxAncho: 328, maxAlto: 350 });
    expect(c.obra.width).toBeGreaterThan(0);
    expect(c.obra.width / c.obra.height).toBeCloseTo(960 / 999, 1);
  });
});

import { debeMostrarEntradaSala, OBRAS_SALA_ABIERTAS, paradasSegunSesion, recorridoAbierto } from "./sala-cuenta";
describe("candado de cuenta de La sala", () => {
  const paradas = [
    { tipo: "apertura" as const, indice: 0, zoom: 1, titulo: "Título", texto: "Texto narrativo" },
    { tipo: "detalle" as const, indice: 1, x: 0.5, y: 0.5, zoom: 3, titulo: "Detalle", texto: "Otro texto" },
    { tipo: "cierre" as const, indice: 2, zoom: 1, titulo: "Cierre", texto: "Fin" },
  ];
  it("con sesión se ve el recorrido completo", () => {
    const r = paradasSegunSesion(paradas, { userId: "u1" });
    expect(r.bloqueado).toBe(false);
    expect(r.paradas).toEqual(paradas);
    expect(recorridoAbierto({ userId: "u1" })).toBe(true);
  });
  it("sin sesión solo el adelanto: obra y título, sin textos ni detalles", () => {
    for (const s of [null, undefined]) {
      const r = paradasSegunSesion(paradas, s);
      expect(r.bloqueado).toBe(true);
      expect(r.paradas).toHaveLength(1);
      expect(r.paradas[0]).toMatchObject({ tipo: "apertura", titulo: "Título", texto: "" });
    }
    expect(recorridoAbierto(null)).toBe(false);
  });
  it("sin sesión no se abre el vuelo ni la entrada; con sesión sí (salvo reducir movimiento)", () => {
    for (const sin of [null, undefined, { userId: "" }]) {
      expect(debeMostrarEntradaSala(sin, false)).toBe(false);
      expect(debeMostrarEntradaSala(sin, true)).toBe(false);
    }
    expect(debeMostrarEntradaSala({ userId: "u1" }, false)).toBe(true);
    expect(debeMostrarEntradaSala({ userId: "u1" }, true)).toBe(false);
  });
  it("sin sesión el recorrido queda reducido a una sola parada y bloqueado", () => {
    const r = paradasSegunSesion(paradas, null);
    expect(r.bloqueado).toBe(true);
    expect(r.paradas.map((p) => p.tipo)).toEqual(["apertura"]);
  });
  it("tres obras abiertas: recorrido completo sin sesión; el vuelo sigue pidiendo cuenta", () => {
    const r = paradasSegunSesion(paradas, null, "gn-01");
    expect(r.bloqueado).toBe(false);
    expect(r.paradas).toEqual(paradas);
    for (const id of OBRAS_SALA_ABIERTAS) expect(paradasSegunSesion(paradas, undefined, id).bloqueado).toBe(false);
    expect(paradasSegunSesion(paradas, null, "gn-02").bloqueado).toBe(true);
    expect(debeMostrarEntradaSala(null, false)).toBe(false);
    expect(recorridoAbierto(null)).toBe(false);
  });
});

describe("vuelo corto (5,5 s)", () => {
  it("dura 5,5 s y los tiempos son coherentes", () => {
    expect(DURACION_VUELO_MS).toBe(5500);
    expect(tiemposVueloVivo()).toMatchObject({
      salaIn: DURACION_VUELO_MS - 150,
      total: DURACION_VUELO_MS + 1600,
      edificioIn: DURACION_VUELO_MS,
      edificioOut: DURACION_VUELO_MS,
    });
  });
  it("arranca cerca de la Tierra y los rangos decrecen", () => {
    const k = vueloDeSede("bonnefanten")!.keyframes;
    expect(k[0].rango).toBe(11_000_000);
    expect(k[1].rango).toBe(1_200_000);
    expect(k[k.length - 1].rango).toBe(270);
    for (let i = 1; i < k.length; i++) expect(k[i].rango).toBeLessThan(k[i - 1].rango);
  });
});
