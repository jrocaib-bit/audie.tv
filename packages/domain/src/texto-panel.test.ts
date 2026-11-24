import { describe, expect, it } from "vitest";
import {
  FUENTE_TORRES_AMAT,
  TAMANOS_TEXTO,
  TAMANO_INICIAL,
  avisoFuente,
  estadoDeRespuesta,
  estaSincronizado,
  idTextoValido,
  leerModo,
  leerTamano,
  leerTextoEpisodio,
  marcasDeTiempo,
  pasoTamano,
  textosPanel,
  versiculoActual,
} from "./texto-panel";

const conTiempos = [{ t: 0 }, { t: 10 }, { t: 25 }, { t: 40 }];

describe("versículo actual", () => {
  const marcas = marcasDeTiempo(conTiempos);

  it("devuelve -1 antes del primer versículo", () => {
    expect(versiculoActual(marcasDeTiempo([{ t: 5 }, { t: 9 }]), 4.99)).toBe(-1);
  });

  it("marca el versículo exacto y los huecos entre versículos", () => {
    expect(versiculoActual(marcas, 0)).toBe(0);
    expect(versiculoActual(marcas, 9.99)).toBe(0);
    expect(versiculoActual(marcas, 10)).toBe(1);
    expect(versiculoActual(marcas, 30)).toBe(2);
  });

  it("se queda en el último tras el final", () => {
    expect(versiculoActual(marcas, 4000)).toBe(3);
  });

  it("ordena tiempos desordenados", () => {
    const desordenadas = marcasDeTiempo([{ t: 30 }, { t: 0 }, { t: 12 }]);
    expect(versiculoActual(desordenadas, 1)).toBe(1);
    expect(versiculoActual(desordenadas, 15)).toBe(2);
    expect(versiculoActual(desordenadas, 31)).toBe(0);
  });

  it("con tiempos repetidos gana el que va después en el texto", () => {
    const repetidas = marcasDeTiempo([{ t: 0 }, { t: 8 }, { t: 8 }, { t: 20 }]);
    expect(versiculoActual(repetidas, 8)).toBe(2);
    expect(versiculoActual(repetidas, 19)).toBe(2);
  });

  it("devuelve -1 sin tiempos o con un segundo no finito", () => {
    expect(versiculoActual(marcasDeTiempo([{}, {}]), 10)).toBe(-1);
    expect(versiculoActual([], 10)).toBe(-1);
    expect(versiculoActual(marcas, Number.NaN)).toBe(-1);
  });

  it("salta los versículos sin tiempo y los tiempos negativos", () => {
    const mezcla = marcasDeTiempo([{ t: 0 }, {}, { t: -3 }, { t: 6 }]);
    expect(mezcla.map((marca) => marca.indice)).toEqual([0, 3]);
    expect(versiculoActual(mezcla, 7)).toBe(3);
  });
});

describe("sincronía", () => {
  it("pide tiempo en al menos el 80 % de los versículos", () => {
    expect(estaSincronizado([{ t: 1 }, { t: 2 }, { t: 3 }, { t: 4 }, {}])).toBe(true);
    expect(estaSincronizado([{ t: 1 }, { t: 2 }, { t: 3 }, {}, {}])).toBe(false);
    expect(estaSincronizado([])).toBe(false);
  });
});

describe("lectura defensiva", () => {
  const valido = {
    version: 1,
    episodio: "gn-01",
    idioma: "es",
    muestra: true,
    fuente: "Fuente inventada",
    credito: "Crédito inventado",
    versiculos: [{ ref: "1,1", cap: 1, v: "1", texto: "Frase inventada.", t: 2 }, { ref: "1,5a", cap: 1, v: "5a", texto: "Otra." }],
  };

  it("acepta un texto bien formado y conserva «5a»", () => {
    const texto = leerTextoEpisodio(valido);
    expect(texto?.versiculos[1]?.v).toBe("5a");
    expect(texto?.versiculos[1]?.t).toBeUndefined();
  });

  it("rechaza formas rotas", () => {
    expect(leerTextoEpisodio(null)).toBeNull();
    expect(leerTextoEpisodio({ ...valido, version: 2 })).toBeNull();
    expect(leerTextoEpisodio({ ...valido, episodio: "../x" })).toBeNull();
    expect(leerTextoEpisodio({ ...valido, versiculos: [{ ref: "1", cap: 1, v: 1, texto: "x" }] })).toBeNull();
  });

  it("valida ids sin recorrido de rutas", () => {
    expect(idTextoValido("gn-01")).toBe(true);
    expect(idTextoValido("../gn")).toBe(false);
    expect(idTextoValido("GN-01")).toBe(false);
    expect(idTextoValido("a")).toBe(false);
    expect(idTextoValido("a".repeat(25))).toBe(false);
  });
});

describe("estado y preferencias", () => {
  it("traduce las respuestas de la API", () => {
    expect(estadoDeRespuesta(401)).toBe("sin-sesion");
    expect(estadoDeRespuesta(403)).toBe("sin-permiso");
    expect(estadoDeRespuesta(404, "sin-texto")).toBe("sin-texto");
    expect(estadoDeRespuesta(404, "no-encontrado")).toBe("apagado");
    expect(estadoDeRespuesta(503)).toBe("error");
  });

  it("limita el tamaño de letra a cinco pasos", () => {
    expect(TAMANOS_TEXTO).toHaveLength(5);
    expect(pasoTamano(0, -1)).toBe(0);
    expect(pasoTamano(4, 1)).toBe(4);
    expect(pasoTamano(2, 1)).toBe(3);
    expect(leerTamano("9")).toBe(TAMANO_INICIAL);
    expect(leerTamano("3")).toBe(3);
    expect(leerTamano(null)).toBe(TAMANO_INICIAL);
    expect(leerModo("dia")).toBe("dia");
    expect(leerModo("otro")).toBe("noche");
  });

  it("escribe los textos sin punto y coma ni rayas", () => {
    for (const idioma of ["es", "en"]) {
      const textos = textosPanel(idioma);
      for (const valor of Object.values(textos)) {
        const cadena = typeof valor === "function" ? valor("5a") : valor;
        expect(cadena).not.toMatch(/[;—–]/);
      }
    }
    expect(textosPanel("es").muestra).toBe("Texto de ejemplo, no es una edición bíblica");
  });
});

describe("aviso de la fuente", () => {
  it("lleva el aviso literal solo con texto real de Torres Amat", () => {
    const es = textosPanel("es");
    expect(es.avisoTorresAmat).toBe("Texto: Torres Amat (dominio público). Puede no coincidir palabra por palabra con el audio");
    expect(avisoFuente({ muestra: false, fuente: FUENTE_TORRES_AMAT }, es)).toBe(es.avisoTorresAmat);
    expect(avisoFuente({ muestra: true, fuente: FUENTE_TORRES_AMAT }, es)).toBeNull();
    expect(avisoFuente({ muestra: false, fuente: "otra edición" }, es)).toBeNull();
    expect(textosPanel("en").avisoTorresAmat).toContain("Torres Amat (public domain)");
  });
});
