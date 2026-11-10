import { describe, expect, it } from "vitest";
import { adviento1, bautismoDelSenor, capitulosAMedias, diaLiturgicoDeIso, fraccionReto, miercolesCeniza, pascua, pentecostes, referenciaPaso, textoAvisoLiturgico, textoDiaLiturgico, tramosDelAnio } from "./liturgia";

const PASCUA = ["2025-04-20", "2026-04-05", "2027-03-28", "2028-04-16", "2029-04-01", "2030-04-21"];
const CENIZA = ["2025-03-05", "2026-02-18", "2027-02-10", "2028-03-01", "2029-02-14", "2030-03-06"];
const PENTECOSTES = ["2025-06-08", "2026-05-24", "2027-05-16", "2028-06-04", "2029-05-20", "2030-06-09"];
const ADVIENTO = ["2025-11-30", "2026-11-29", "2027-11-28", "2028-12-03", "2029-12-02", "2030-12-01"];

describe("calendario litúrgico", () => {
  it("calcula Pascua, Ceniza, Pentecostés y Adviento de 2025 a 2030", () => {
    PASCUA.forEach((fecha, indice) => expect(pascua(2025 + indice)).toBe(fecha));
    CENIZA.forEach((fecha, indice) => expect(miercolesCeniza(2025 + indice)).toBe(fecha));
    PENTECOSTES.forEach((fecha, indice) => expect(pentecostes(2025 + indice)).toBe(fecha));
    ADVIENTO.forEach((fecha, indice) => expect(adviento1(2025 + indice)).toBe(fecha));
  });

  it("cierra la Navidad en el Bautismo y lo pasa al lunes si la Epifanía cae en domingo", () => {
    expect(bautismoDelSenor(2025)).toBe("2025-01-12");
    expect(bautismoDelSenor(2026)).toBe("2026-01-11");
    expect(bautismoDelSenor(2027)).toBe("2027-01-10");
    expect(bautismoDelSenor(2030)).toBe("2030-01-07");
    expect(diaLiturgicoDeIso("2026-01-11").tiempo).toBe("navidad");
    expect(diaLiturgicoDeIso("2026-01-12").tiempo).toBe("ordinario");
    expect(diaLiturgicoDeIso("2027-01-10")).toMatchObject({ tiempo: "navidad", celebracion: { es: "Bautismo del Señor" } });
    expect(diaLiturgicoDeIso("2027-01-11").tiempo).toBe("ordinario");
    expect(diaLiturgicoDeIso("2030-01-06").solemnidad?.es).toBe("Epifanía");
  });

  it("nombre el tiempo, la semana y el color, con rosa en Gaudete y Laetare", () => {
    expect(diaLiturgicoDeIso("2025-12-02")).toMatchObject({ tiempo: "adviento", semana: 1, color: "morado", ciclo: "A", ferial: "par", etiqueta: { es: "Adviento · Semana 1" } });
    expect(diaLiturgicoDeIso("2025-12-14").color).toBe("rosa");
    expect(diaLiturgicoDeIso("2026-02-18").etiqueta.es).toBe("Miércoles de Ceniza");
    expect(diaLiturgicoDeIso("2026-03-01")).toMatchObject({ tiempo: "cuaresma", semana: 2, dia: 12, color: "morado" });
    expect(textoDiaLiturgico(diaLiturgicoDeIso("2026-03-01"), "es")).toBe("Día 12 de Cuaresma");
    expect(diaLiturgicoDeIso("2026-03-15").color).toBe("rosa");
    expect(diaLiturgicoDeIso("2026-03-29")).toMatchObject({ tiempo: "semana-santa", color: "rojo" });
    expect(diaLiturgicoDeIso("2026-04-02")).toMatchObject({ tiempo: "triduo", color: "blanco" });
    expect(diaLiturgicoDeIso("2026-04-03")).toMatchObject({ tiempo: "triduo", color: "rojo" });
    expect(diaLiturgicoDeIso("2026-04-05")).toMatchObject({ tiempo: "pascua", semana: 1, color: "blanco", ciclo: "A" });
    expect(diaLiturgicoDeIso("2026-04-12").etiqueta.es).toBe("Pascua · Semana 2");
    expect(diaLiturgicoDeIso("2026-05-24")).toMatchObject({ tiempo: "pascua", color: "rojo", solemnidad: { es: "Pentecostés" } });
    expect(diaLiturgicoDeIso("2026-07-12")).toMatchObject({ tiempo: "ordinario", color: "verde" });
    expect(diaLiturgicoDeIso("2025-06-15").ciclo).toBe("C");
  });

  it("traslada la Anunciación fuera del Triduo y la Inmaculada fuera del domingo de Adviento", () => {
    expect(diaLiturgicoDeIso("2027-03-25").solemnidad).toBeNull();
    expect(diaLiturgicoDeIso("2027-04-05").solemnidad?.es).toBe("La Anunciación");
    expect(diaLiturgicoDeIso("2030-12-08").solemnidad).toBeNull();
    expect(diaLiturgicoDeIso("2030-12-09").solemnidad?.es).toBe("La Inmaculada Concepción");
    expect(diaLiturgicoDeIso("2025-12-08").solemnidad?.es).toBe("La Inmaculada Concepción");
    expect(diaLiturgicoDeIso("2025-12-08").tiempo).toBe("adviento");
  });

  it("parte el año en tramos continuos y cuenta los capítulos a medias", () => {
    const tramos = tramosDelAnio("2026-03-01");
    expect(tramos.map((tramo) => tramo.tiempo)).toEqual(["adviento", "navidad", "ordinario", "cuaresma", "semana-santa", "pascua", "ordinario"]);
    expect(tramos[0]?.inicio).toBe("2025-11-30");
    expect(tramos.at(-1)?.fin).toBe("2026-11-28");
    expect(capitulosAMedias({
      "gn-01": { positionSeconds: 20, completed: false, updatedAt: "2026-03-01" },
      "gn-02": { positionSeconds: 10, completed: false, updatedAt: "2026-03-02" },
      "ex-01": { positionSeconds: 4, completed: true, updatedAt: "2026-03-03" },
      "sal-03": { positionSeconds: 0, completed: false, updatedAt: "2026-03-04" },
    })).toEqual(["gn-02"]);
    expect(fraccionReto([1, 1, 2], 3)).toMatchObject({ hechos: 2, completo: false });
    expect(fraccionReto([1, 2, 3], 3).completo).toBe(true);
    expect(referenciaPaso({ libroId: "ex", capitulo: 3, versiculo: 1, versiculoFin: 15 }, "es", true)).toBe("Éxodo 3,1–15");
    expect(referenciaPaso({ libroId: "is", capitulo: 40, versiculo: 1, versiculoFin: 11 }, "es")).toBe("Is 40,1–11");
  });

  it("cubre 1900-2200, el santoral y el salterio", () => {
    for (let anio = 1900; anio <= 2200; anio += 1) {
      const fecha = pascua(anio);
      const dia = new Date(`${fecha}T00:00:00Z`).getUTCDay();
      const [, mes, numero] = fecha.split("-").map(Number);
      expect(dia).toBe(0);
      expect(mes === 3 || mes === 4).toBe(true);
      const ordinal = (mes === 3 ? 0 : 31) + (numero ?? 0);
      expect(ordinal).toBeGreaterThanOrEqual(22);
      expect(ordinal).toBeLessThanOrEqual(56);
    }
    expect(pascua(1900)).toBe("1900-04-15");
    expect(pascua(2000)).toBe("2000-04-23");
    expect(pascua(2100)).toBe("2100-03-28");
    expect(pascua(2200)).toBe("2200-04-06");
    const martin = diaLiturgicoDeIso("2026-11-11");
    expect(martin.celebracion?.es).toBe("San Martín de Tours");
    expect(martin.rango).toBe("memoria");
    expect(martin.salterio).toBeGreaterThanOrEqual(1);
    expect(diaLiturgicoDeIso("2026-03-29").celebracion?.es).toBe("Domingo de Ramos");
    expect(diaLiturgicoDeIso("2026-05-24").celebracion?.es).toBe("Pentecostés");
    expect(textoAvisoLiturgico(diaLiturgicoDeIso("2025-11-30"), "es")).toBe("Hoy empieza el Adviento");
    expect(textoAvisoLiturgico(diaLiturgicoDeIso("2026-02-18"), "es")).toBe("Miércoles de Ceniza");
  });

  it("asigna los rangos de las Normas universales del año litúrgico", () => {
    const domingo = (iso: string) => new Date(`${iso}T00:00:00Z`).getUTCDay() === 0;
    expect(diaLiturgicoDeIso("2026-02-18")).toMatchObject({ rango: "feria", etiqueta: { es: "Miércoles de Ceniza" } });
    expect(diaLiturgicoDeIso("2026-03-02").rango).toBe("feria");
    expect(diaLiturgicoDeIso("2026-03-29")).toMatchObject({ rango: "domingo", etiqueta: { es: "Domingo de Ramos" } });
    expect(diaLiturgicoDeIso("2026-04-02")).toMatchObject({ rango: "triduo", etiqueta: { es: "Jueves Santo" } });
    expect(diaLiturgicoDeIso("2026-04-03")).toMatchObject({ rango: "triduo", etiqueta: { es: "Viernes Santo" } });
    expect(diaLiturgicoDeIso("2026-04-04")).toMatchObject({ rango: "triduo", etiqueta: { es: "Sábado Santo" } });
    expect(diaLiturgicoDeIso("2026-04-05").rango).toBe("solemnidad");
    expect(diaLiturgicoDeIso("2026-04-06").rango).toBe("solemnidad");
    expect(diaLiturgicoDeIso("2026-04-12")).toMatchObject({ rango: "solemnidad", etiqueta: { es: "Pascua · Semana 2" } });
    expect(diaLiturgicoDeIso("2026-04-13").rango).toBe("tiempo");
    expect(diaLiturgicoDeIso("2026-12-25")).toMatchObject({ rango: "solemnidad", etiqueta: { es: "Natividad del Señor · solemnidad" } });
    expect(diaLiturgicoDeIso("2026-12-26").rango).toBe("fiesta");
    expect(diaLiturgicoDeIso("2026-12-29")).toMatchObject({ rango: "octava", etiqueta: { es: "Octava de Navidad" } });
    expect(diaLiturgicoDeIso("2027-01-01").rango).toBe("solemnidad");
    expect(diaLiturgicoDeIso("2026-12-17").rango).toBe("feria");
    expect(diaLiturgicoDeIso("2026-12-24").rango).toBe("feria");
    expect(diaLiturgicoDeIso("2026-12-20")).toMatchObject({ rango: "domingo", etiqueta: { es: "Adviento · Semana 4" } });
    expect(diaLiturgicoDeIso("2025-12-07").rango).toBe("domingo");
    expect(diaLiturgicoDeIso("2026-07-12").rango).toBe("domingo");
    const ascension = diaLiturgicoDeIso("2026-05-17");
    const corpus = diaLiturgicoDeIso("2026-06-07");
    expect(ascension).toMatchObject({ rango: "solemnidad", etiqueta: { es: "Ascensión · solemnidad" } });
    expect(corpus).toMatchObject({ rango: "solemnidad", etiqueta: { es: "Corpus Christi · solemnidad" } });
    expect(domingo(ascension.iso)).toBe(true);
    expect(domingo(corpus.iso)).toBe(true);
    expect(diaLiturgicoDeIso("2026-02-18").etiqueta.es.includes("solemnidad")).toBe(false);
    expect(diaLiturgicoDeIso("2026-03-29").etiqueta.es.includes("solemnidad")).toBe(false);
    expect(diaLiturgicoDeIso("2026-04-03").etiqueta.es.includes("solemnidad")).toBe(false);
  });
});
