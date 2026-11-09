import { describe, expect, it } from "vitest";
import {
  espacioUsado,
  idsDeAlcance,
  parseArchivos,
  parsePreferencia,
  planificar,
  puedeBajar,
  quitarArchivo,
  registrarArchivo,
  textoEspacio,
  uriDeReproduccion,
  urisDeReproduccion,
  type ArchivoLocal,
  type EpisodioDescargable,
} from "./descargas";

const episodios: EpisodioDescargable[] = [
  { id: "gn-01", bookId: "gn", titulo: "En el principio", bytes: 1000, remoto: "/a.mp3" },
  { id: "gn-02", bookId: "gn", titulo: "La caída", bytes: 2000, remoto: "/b.mp3" },
  { id: "ex-01", bookId: "ex", titulo: "Éxodo", bytes: 3000, remoto: "/c.mp3" },
];

describe("descargas", () => {
  it("solo baja por wifi cuando así se pide", () => {
    expect(puedeBajar(true, "wifi")).toBe("listo");
    expect(puedeBajar(true, "celular")).toBe("solo-wifi");
    expect(puedeBajar(false, "celular")).toBe("listo");
    expect(puedeBajar(false, "sin-red")).toBe("sin-red");
  });

  it("arma el episodio, el libro y el camino de la semana sin repetir lo oído", () => {
    expect(idsDeAlcance("episodio", episodios, { episodioId: "gn-01", camino: [], oidos: new Set() })).toEqual(["gn-01"]);
    expect(idsDeAlcance("libro", episodios, { bookId: "gn", camino: [], oidos: new Set() })).toEqual(["gn-01", "gn-02"]);
    expect(idsDeAlcance("semana", episodios, { camino: ["gn-01", "gn-02", "ex-01"], oidos: new Set(["gn-01"]) })).toEqual(["gn-02", "ex-01"]);
    expect(idsDeAlcance("episodio", episodios, { episodioId: "no", camino: [], oidos: new Set() })).toEqual([]);
  });

  it("no vuelve a pedir lo que ya está en el dispositivo y suma el espacio", () => {
    const archivos: ArchivoLocal[] = [{ episodeId: "gn-01", bytes: 1000, ruta: "file://gn-01.mp3", actualizadoEn: "2026-11-09" }];
    expect(planificar(["gn-01", "gn-02"], archivos)).toEqual({ nuevos: ["gn-02"], ya: ["gn-01"] });
    expect(espacioUsado(archivos)).toBe(1000);
    expect(espacioUsado(quitarArchivo(archivos, "gn-01"))).toBe(0);
  });

  it("el reproductor usa el archivo local si existe", () => {
    const vacio = uriDeReproduccion("gn-01", "https://audite.example/a.mp3", []);
    expect(vacio).toEqual({ origen: "red", uri: "https://audite.example/a.mp3" });
    const local = uriDeReproduccion("gn-01", "https://audite.example/a.mp3", [
      { episodeId: "gn-01", bytes: 10, ruta: "file://gn-01.mp3", actualizadoEn: "" },
    ]);
    expect(local.origen).toBe("local");
    expect(local.uri).toBe("file://gn-01.mp3");
    const partes = urisDeReproduccion("gn-01", [{ id: "a", remoto: "/a.mp3" }, { id: "b", remoto: "/b.mp3" }], [
      { episodeId: "gn-01", bytes: 10, ruta: "file://indice", actualizadoEn: "", segmentos: [{ id: "a", ruta: "file://a" }, { id: "b", ruta: "file://b" }] },
    ]);
    expect(partes).toEqual({ origen: "local", uris: ["file://a", "file://b"] });
  });

  it("recupera el índice guardado y formatea el espacio en español", () => {
    expect(parsePreferencia(null).soloWifi).toBe(true);
    expect(parsePreferencia({ soloWifi: false }).soloWifi).toBe(false);
    const archivos = parseArchivos({ archivos: [{ episodeId: "gn-01", ruta: "file://a", bytes: 10 }, { episodeId: 1 }] });
    expect(archivos).toEqual([{ episodeId: "gn-01", bytes: 10, ruta: "file://a", actualizadoEn: "" }]);
    expect(registrarArchivo(archivos, { episodeId: "gn-01", bytes: 12, ruta: "file://b", actualizadoEn: "hoy" })).toHaveLength(1);
    expect(textoEspacio(1536 * 1024, "es")).toBe("1,5 MB");
  });
});
