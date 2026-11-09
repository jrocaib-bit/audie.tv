export type TiempoId = "adviento" | "navidad" | "ordinario" | "cuaresma" | "semana-santa" | "triduo" | "pascua";
export type ColorLiturgico = "morado" | "blanco" | "verde" | "rojo" | "rosa";
export type CicloDominical = "A" | "B" | "C";
export type CicloFerial = "par" | "impar";

export type DiaLiturgico = {
  iso: string;
  tiempo: TiempoId;
  nombre: { es: string; en: string };
  semana: number | null;
  dia: number;
  color: ColorLiturgico;
  ciclo: CicloDominical;
  ferial: CicloFerial;
  anio: number;
  etiqueta: { es: string; en: string };
  solemnidad: { es: string; en: string } | null;
};

export type TramoLiturgico = {
  tiempo: TiempoId;
  color: ColorLiturgico;
  inicio: string;
  fin: string;
};

export const COLOR_HEX: Record<ColorLiturgico, string> = {
  morado: "#6E4C8A",
  blanco: "#E4DCCF",
  verde: "#2F6B4F",
  rojo: "#8C3A3A",
  rosa: "#C47B8A",
};

const NOMBRES: Record<TiempoId, { es: string; en: string }> = {
  adviento: { es: "Adviento", en: "Advent" },
  navidad: { es: "Navidad", en: "Christmas" },
  ordinario: { es: "Tiempo ordinario", en: "Ordinary Time" },
  cuaresma: { es: "Cuaresma", en: "Lent" },
  "semana-santa": { es: "Semana Santa", en: "Holy Week" },
  triduo: { es: "Triduo", en: "Triduum" },
  pascua: { es: "Pascua", en: "Easter" },
};

function utc(anio: number, mes: number, dia: number): Date {
  return new Date(Date.UTC(anio, mes - 1, dia));
}

function iso(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

function parse(valor: string): Date {
  const [anio, mes, dia] = valor.split("-").map(Number);
  return utc(anio ?? 1970, mes ?? 1, dia ?? 1);
}

function sumar(fecha: Date, dias: number): Date {
  const siguiente = new Date(fecha.getTime());
  siguiente.setUTCDate(siguiente.getUTCDate() + dias);
  return siguiente;
}

function diasEntre(desde: Date, hasta: Date): number {
  return Math.round((hasta.getTime() - desde.getTime()) / 86400000);
}

export function pascua(anio: number): string {
  const a = anio % 19;
  const b = Math.floor(anio / 100);
  const c = anio % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return iso(utc(anio, mes, dia));
}

export function miercolesCeniza(anio: number): string {
  return iso(sumar(parse(pascua(anio)), -46));
}

export function pentecostes(anio: number): string {
  return iso(sumar(parse(pascua(anio)), 49));
}

export function adviento1(anio: number): string {
  const navidad = utc(anio, 12, 25);
  const dow = navidad.getUTCDay();
  const cuarto = sumar(navidad, dow === 0 ? -7 : -dow);
  return iso(sumar(cuarto, -21));
}

export function bautismoDelSenor(anio: number): string {
  const epifania = utc(anio, 1, 6);
  if (epifania.getUTCDay() === 0) return iso(sumar(epifania, 1));
  return iso(sumar(epifania, (7 - epifania.getUTCDay()) % 7));
}

function domingoEnOAntes(fecha: Date): Date {
  return sumar(fecha, -fecha.getUTCDay());
}

function domingoEnODespues(fecha: Date): Date {
  return sumar(fecha, (7 - fecha.getUTCDay()) % 7);
}

function cicloDe(anio: number): { ciclo: CicloDominical; ferial: CicloFerial } {
  const resto = anio % 3;
  return {
    ciclo: resto === 1 ? "A" : resto === 2 ? "B" : "C",
    ferial: anio % 2 === 0 ? "par" : "impar",
  };
}

function anioLiturgico(fecha: Date): number {
  const anio = fecha.getUTCFullYear();
  return fecha.getTime() >= parse(adviento1(anio)).getTime() ? anio + 1 : anio;
}

type Solemnidad = { iso: string; es: string; en: string; color: ColorLiturgico };

function trasladarAnunciacion(anio: number): string {
  const fecha = utc(anio, 3, 25);
  const domingoPascua = parse(pascua(anio));
  const ramos = sumar(domingoPascua, -7);
  const finOctava = sumar(domingoPascua, 7);
  if (fecha.getTime() >= ramos.getTime() && fecha.getTime() <= finOctava.getTime()) return iso(sumar(finOctava, 1));
  return iso(fecha);
}

function trasladarJose(anio: number): string {
  let fecha = utc(anio, 3, 19);
  const domingoPascua = parse(pascua(anio));
  const ramos = sumar(domingoPascua, -7);
  if (fecha.getUTCDay() === 0 && fecha.getTime() < ramos.getTime()) fecha = sumar(fecha, 1);
  const finOctava = sumar(domingoPascua, 7);
  if (fecha.getTime() >= ramos.getTime() && fecha.getTime() <= finOctava.getTime()) return iso(sumar(finOctava, 1));
  return iso(fecha);
}

export function solemnidades(anio: number): Solemnidad[] {
  const domingoPascua = parse(pascua(anio));
  const ascension = sumar(domingoPascua, 42);
  const pentecostesFecha = sumar(domingoPascua, 49);
  const corpus = sumar(pentecostesFecha, 14);
  const cristoRey = sumar(parse(adviento1(anio)), -7);
  const inmaculada = utc(anio, 12, 8).getUTCDay() === 0 ? utc(anio, 12, 9) : utc(anio, 12, 8);
  return [
    { iso: iso(utc(anio, 1, 1)), es: "Santa María, Madre de Dios", en: "Mary, Mother of God", color: "blanco" },
    { iso: iso(utc(anio, 1, 6)), es: "Epifanía", en: "Epiphany", color: "blanco" },
    { iso: trasladarJose(anio), es: "San José", en: "Saint Joseph", color: "blanco" },
    { iso: trasladarAnunciacion(anio), es: "Anunciación", en: "Annunciation", color: "blanco" },
    { iso: iso(ascension), es: "Ascensión", en: "Ascension", color: "blanco" },
    { iso: iso(pentecostesFecha), es: "Pentecostés", en: "Pentecost", color: "rojo" },
    { iso: iso(sumar(pentecostesFecha, 7)), es: "Santísima Trinidad", en: "Trinity", color: "blanco" },
    { iso: iso(corpus), es: "Corpus Christi", en: "Corpus Christi", color: "blanco" },
    { iso: iso(utc(anio, 6, 29)), es: "San Pedro y san Pablo", en: "Peter and Paul", color: "rojo" },
    { iso: iso(utc(anio, 7, 25)), es: "Santiago", en: "Saint James", color: "rojo" },
    { iso: iso(utc(anio, 8, 15)), es: "Asunción", en: "Assumption", color: "blanco" },
    { iso: iso(utc(anio, 11, 1)), es: "Todos los Santos", en: "All Saints", color: "blanco" },
    { iso: iso(cristoRey), es: "Cristo Rey", en: "Christ the King", color: "blanco" },
    { iso: iso(inmaculada), es: "Inmaculada", en: "Immaculate Conception", color: "blanco" },
    { iso: iso(utc(anio, 12, 25)), es: "Navidad", en: "Christmas", color: "blanco" },
  ];
}

function semanaOrdinarioInicial(fecha: Date, bautismo: Date): number {
  const siguienteDomingo = sumar(bautismo, bautismo.getUTCDay() === 0 ? 7 : (7 - bautismo.getUTCDay()));
  if (fecha.getTime() < siguienteDomingo.getTime()) return 1;
  return 2 + Math.floor(diasEntre(siguienteDomingo, fecha) / 7);
}

function semanaOrdinarioFinal(fecha: Date, cristoRey: Date, pentecostesFecha: Date): number {
  const previo = domingoEnOAntes(fecha);
  const domingo = previo.getTime() <= pentecostesFecha.getTime() ? domingoEnODespues(sumar(pentecostesFecha, 1)) : previo;
  const rey = domingoEnOAntes(cristoRey);
  return 34 - Math.round(diasEntre(domingo, rey) / 7);
}

function armar(
  fecha: Date,
  tiempo: TiempoId,
  semana: number | null,
  inicio: Date,
  color: ColorLiturgico,
  especial: { es: string; en: string } | null,
): DiaLiturgico {
  const anio = anioLiturgico(fecha);
  const ciclos = cicloDe(anio);
  const nombre = NOMBRES[tiempo];
  const etiqueta = especial
    ? { es: `${nombre.es} · ${especial.es}`, en: `${nombre.en} · ${especial.en}` }
    : semana
      ? { es: `${nombre.es} · Semana ${semana}`, en: `${nombre.en} · Week ${semana}` }
      : nombre;
  return {
    iso: iso(fecha),
    tiempo,
    nombre,
    semana,
    dia: diasEntre(inicio, fecha) + 1,
    color,
    ciclo: ciclos.ciclo,
    ferial: ciclos.ferial,
    anio,
    etiqueta,
    solemnidad: null,
  };
}

export function diaLiturgicoDeIso(valor: string): DiaLiturgico {
  const fecha = parse(valor);
  const anio = fecha.getUTCFullYear();
  const domingoPascua = parse(pascua(anio));
  const ceniza = sumar(domingoPascua, -46);
  const ramos = sumar(domingoPascua, -7);
  const juevesSanto = sumar(domingoPascua, -3);
  const cuaresma1 = sumar(domingoPascua, -42);
  const pentecostesFecha = sumar(domingoPascua, 49);
  const bautismo = parse(bautismoDelSenor(anio));
  const adviento = parse(adviento1(anio));
  const navidad = utc(anio, 12, 25);
  let dia: DiaLiturgico;

  if (fecha.getTime() >= adviento.getTime()) {
    if (fecha.getTime() >= navidad.getTime()) dia = armar(fecha, "navidad", null, navidad, "blanco", null);
    else {
      const semana = Math.floor(diasEntre(adviento, fecha) / 7) + 1;
      const gaudete = semana === 3 && fecha.getUTCDay() === 0;
      dia = armar(fecha, "adviento", semana, adviento, gaudete ? "rosa" : "morado", null);
    }
  } else if (fecha.getTime() <= bautismo.getTime()) {
    dia = armar(fecha, "navidad", null, utc(anio - 1, 12, 25), "blanco", null);
  } else if (fecha.getTime() < ceniza.getTime()) {
    dia = armar(fecha, "ordinario", semanaOrdinarioInicial(fecha, bautismo), sumar(bautismo, 1), "verde", null);
  } else if (fecha.getTime() < ramos.getTime()) {
    const semana = fecha.getTime() < cuaresma1.getTime() ? null : Math.floor(diasEntre(cuaresma1, fecha) / 7) + 1;
    const laetare = semana === 4 && fecha.getUTCDay() === 0;
    const cenizaHoy = fecha.getTime() === ceniza.getTime();
    dia = armar(fecha, "cuaresma", semana, ceniza, laetare ? "rosa" : "morado", cenizaHoy ? { es: "Ceniza", en: "Ash Wednesday" } : null);
  } else if (fecha.getTime() < juevesSanto.getTime()) {
    dia = armar(fecha, "semana-santa", null, ramos, fecha.getTime() === ramos.getTime() ? "rojo" : "morado", null);
  } else if (fecha.getTime() < domingoPascua.getTime()) {
    const color: ColorLiturgico = fecha.getTime() === juevesSanto.getTime() ? "blanco" : diasEntre(domingoPascua, fecha) === -2 ? "rojo" : "morado";
    dia = armar(fecha, "triduo", null, juevesSanto, color, null);
  } else if (fecha.getTime() <= pentecostesFecha.getTime()) {
    const semana = Math.floor(diasEntre(domingoPascua, fecha) / 7) + 1;
    const pentecostesHoy = fecha.getTime() === pentecostesFecha.getTime();
    dia = armar(fecha, "pascua", semana, domingoPascua, pentecostesHoy ? "rojo" : "blanco", pentecostesHoy ? { es: "Pentecostés", en: "Pentecost" } : null);
  } else {
    const rey = sumar(parse(adviento1(anio)), -7);
    dia = armar(fecha, "ordinario", semanaOrdinarioFinal(fecha, rey, pentecostesFecha), sumar(pentecostesFecha, 1), "verde", null);
  }

  const fiesta = [...solemnidades(anio), ...solemnidades(anio - 1), ...solemnidades(anio + 1)].find((item) => item.iso === valor);
  if (!fiesta || fiesta.es === dia.nombre.es) return dia;
  const nombreFiesta = { es: fiesta.es, en: fiesta.en };
  return {
    ...dia,
    color: fiesta.color,
    solemnidad: nombreFiesta,
    etiqueta: { es: `${dia.nombre.es} · ${fiesta.es}`, en: `${dia.nombre.en} · ${fiesta.en}` },
  };
}

export function diaLiturgico(fecha: Date): DiaLiturgico {
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return diaLiturgicoDeIso(`${fecha.getFullYear()}-${mes}-${dia}`);
}

export function textoDiaLiturgico(dia: DiaLiturgico, locale: "es" | "en"): string {
  if (locale === "en") return `Day ${dia.dia} of ${dia.nombre.en}`;
  return `Día ${dia.dia} de ${dia.nombre.es}`;
}

export function tramosDelAnio(valor: string): TramoLiturgico[] {
  const anio = diaLiturgicoDeIso(valor).anio;
  const inicioAdviento = parse(adviento1(anio - 1));
  const navidad = utc(anio - 1, 12, 25);
  const bautismo = parse(bautismoDelSenor(anio));
  const ceniza = parse(miercolesCeniza(anio));
  const ramos = sumar(parse(pascua(anio)), -7);
  const domingoPascua = parse(pascua(anio));
  const pentecostesFecha = sumar(domingoPascua, 49);
  const fin = sumar(parse(adviento1(anio)), -1);
  const cortes: { tiempo: TiempoId; color: ColorLiturgico; desde: Date }[] = [
    { tiempo: "adviento", color: "morado", desde: inicioAdviento },
    { tiempo: "navidad", color: "blanco", desde: navidad },
    { tiempo: "ordinario", color: "verde", desde: sumar(bautismo, 1) },
    { tiempo: "cuaresma", color: "morado", desde: ceniza },
    { tiempo: "semana-santa", color: "rojo", desde: ramos },
    { tiempo: "pascua", color: "blanco", desde: domingoPascua },
    { tiempo: "ordinario", color: "verde", desde: sumar(pentecostesFecha, 1) },
  ];
  return cortes.map((corte, indice) => {
    const hasta = cortes[indice + 1]?.desde ? sumar(cortes[indice + 1]!.desde, -1) : fin;
    return { tiempo: corte.tiempo, color: corte.color, inicio: iso(corte.desde), fin: iso(hasta) };
  });
}

export type PasoReto = {
  dia: number;
  libroId: string;
  capitulo: number;
  versiculo: number;
  cita: string;
  obra: string | null;
};

export type Reto = {
  id: string;
  tiempo: TiempoId;
  titulo: { es: string; en: string };
  pasos: PasoReto[];
};

export function fraccionReto(hechos: readonly number[], total: number): { hechos: number; total: number; completo: boolean } {
  const unicos = new Set(hechos.filter((dia) => dia >= 1 && dia <= total));
  return { hechos: unicos.size, total, completo: total > 0 && unicos.size >= total };
}

export function capitulosAMedias(episodes: Readonly<Record<string, { positionSeconds: number; completed?: boolean; updatedAt?: string }>>): string[] {
  const porLibro = new Map<string, { id: string; updatedAt: string }>();
  for (const [id, episodio] of Object.entries(episodes)) {
    if (episodio.completed || episodio.positionSeconds <= 0) continue;
    const libro = id.split("-")[0] || id;
    const previo = porLibro.get(libro);
    const updatedAt = episodio.updatedAt ?? "";
    if (!previo || updatedAt >= previo.updatedAt) porLibro.set(libro, { id, updatedAt });
  }
  return [...porLibro.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map((item) => item.id);
}
