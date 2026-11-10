export type Momento = "manana" | "tarde" | "noche";
export type FiltroInicio = "todo" | "caminos" | "libros" | "temas";

export type TarjetaInicio = {
  id: string;
  titulo: string;
  subtitulo: string;
  episodioId: string | null;
  href: string;
  pronto: boolean;
};

export type Estante = {
  id: string;
  titulo: string;
  tarjetas: TarjetaInicio[];
};

export type Tema = { id: string; titulo: { es: string; en: string }; libroId: string; color: string };
export type Personaje = { id: string; titulo: { es: string; en: string }; libroId: string; color: string };

export const TEMAS: readonly Tema[] = [
  { id: "creacion", titulo: { es: "Creación", en: "Creation" }, libroId: "gn", color: "#1E3A34" },
  { id: "salmos", titulo: { es: "Salmos", en: "Psalms" }, libroId: "sal", color: "#3D2B1F" },
  { id: "sabiduria", titulo: { es: "Sabiduría", en: "Wisdom" }, libroId: "prov", color: "#4A2C3A" },
  { id: "evangelio", titulo: { es: "Evangelio", en: "Gospel" }, libroId: "jn", color: "#2C3348" },
  { id: "exodo", titulo: { es: "Éxodo", en: "Exodus" }, libroId: "ex", color: "#5A4632" },
  { id: "apocalipsis", titulo: { es: "Apocalipsis", en: "Revelation" }, libroId: "ap", color: "#1F2A24" },
];

export const PERSONAJES: readonly Personaje[] = [
  { id: "abraham", titulo: { es: "Abrahán", en: "Abraham" }, libroId: "gn", color: "#3D2B1F" },
  { id: "moises", titulo: { es: "Moisés", en: "Moses" }, libroId: "ex", color: "#1E3A34" },
  { id: "david", titulo: { es: "David", en: "David" }, libroId: "sal", color: "#2C3348" },
  { id: "maria", titulo: { es: "María", en: "Mary" }, libroId: "lc", color: "#4A2C3A" },
  { id: "pedro", titulo: { es: "Pedro", en: "Peter" }, libroId: "hch", color: "#5A4632" },
  { id: "pablo", titulo: { es: "Pablo", en: "Paul" }, libroId: "rom", color: "#1F2A24" },
];

const EVANGELIOS = ["mt", "mc", "lc", "jn"] as const;

export function momento(hora: number): Momento {
  if (hora < 12) return "manana";
  if (hora < 20) return "tarde";
  return "noche";
}

export function mixesDeHora(hora: number, diaDelAno: number, locale: string): TarjetaInicio[] {
  const ui = locale === "en" ? "en" : "es";
  const evangelio = EVANGELIOS[Math.abs(diaDelAno) % EVANGELIOS.length] ?? "jn";
  const nombres: Record<string, { es: string; en: string }> = {
    sal: { es: "Salmos", en: "Psalms" },
    mt: { es: "Mateo", en: "Matthew" },
    mc: { es: "Marcos", en: "Mark" },
    lc: { es: "Lucas", en: "Luke" },
    jn: { es: "Juan", en: "John" },
  };
  const salmos = nombres.sal?.[ui] ?? "Salmos";
  const ev = nombres[evangelio]?.[ui] ?? evangelio;
  const tarjetas: TarjetaInicio[] = [
    {
      id: "mix-manana",
      titulo: locale === "en" ? "Morning psalms" : "Salmos de la mañana",
      subtitulo: salmos,
      episodioId: "sal-01",
      href: "/libro/sal",
      pronto: false,
    },
    {
      id: "mix-hoy",
      titulo: locale === "en" ? "Today's gospel" : "Evangelio de hoy",
      subtitulo: ev,
      episodioId: `${evangelio}-01`,
      href: `/libro/${evangelio}`,
      pronto: false,
    },
    {
      id: "mix-dormir",
      titulo: locale === "en" ? "For sleep" : "Para dormir",
      subtitulo: salmos,
      episodioId: "sal-01",
      href: "/libro/sal",
      pronto: false,
    },
  ];
  const actual = momento(hora);
  const orden = actual === "manana" ? ["mix-manana", "mix-hoy", "mix-dormir"] : actual === "tarde" ? ["mix-hoy", "mix-manana", "mix-dormir"] : ["mix-dormir", "mix-hoy", "mix-manana"];
  return orden.map((id) => tarjetas.find((tarjeta) => tarjeta.id === id)!);
}

export function estantes(entrada: {
  locale: string;
  filtro: FiltroInicio;
  hora: number;
  diaDelAno: number;
  escuchados: readonly { id: string; titulo: string }[];
  camino: readonly { id: string; titulo: string }[];
  libros: readonly { id: string; titulo: string }[];
}): Estante[] {
  const { locale, filtro } = entrada;
  const ui = locale === "en" ? "en" : "es";
  const es = ui === "es";
  const sigue: Estante = {
    id: "sigue",
    titulo: es ? "Sigue escuchando" : "Continue",
    tarjetas: entrada.escuchados.slice(0, 8).map((item) => ({
      id: item.id,
      titulo: item.titulo,
      subtitulo: "",
      episodioId: item.id,
      href: `/ahora?e=${item.id}`,
      pronto: false,
    })),
  };
  const hora: Estante = {
    id: "hora",
    titulo: es ? "Hecho para ti" : "Made for you",
    tarjetas: mixesDeHora(entrada.hora, entrada.diaDelAno, locale),
  };
  const caminos: Estante = {
    id: "caminos",
    titulo: es ? "Tus caminos" : "Your paths",
    tarjetas: entrada.camino.slice(0, 8).map((item) => ({
      id: item.id,
      titulo: item.titulo,
      subtitulo: "",
      episodioId: item.id,
      href: `/ahora?e=${item.id}`,
      pronto: false,
    })),
  };
  const temas: Estante = {
    id: "temas",
    titulo: es ? "Por temas" : "Themes",
    tarjetas: TEMAS.map((tema) => ({
      id: tema.id,
      titulo: tema.titulo[ui],
      subtitulo: "",
      episodioId: `${tema.libroId}-01`,
      href: `/tema/${tema.id}`,
      pronto: false,
    })),
  };
  const personajes: Estante = {
    id: "personajes",
    titulo: es ? "Personajes" : "People",
    tarjetas: PERSONAJES.map((persona) => ({
      id: persona.id,
      titulo: persona.titulo[ui],
      subtitulo: "",
      episodioId: `${persona.libroId}-01`,
      href: `/personaje/${persona.id}`,
      pronto: false,
    })),
  };
  const nuevo: Estante = {
    id: "nuevo",
    titulo: es ? "Recién añadido" : "Recently added",
    tarjetas: entrada.libros.slice(0, 10).map((libro) => ({
      id: libro.id,
      titulo: libro.titulo,
      subtitulo: "",
      episodioId: `${libro.id}-01`,
      href: `/libro/${libro.id}`,
      pronto: false,
    })),
  };
  const todos = [sigue, hora, caminos, temas, personajes, nuevo].filter((estante) => estante.tarjetas.length > 0 || estante.id === "hora");
  if (filtro === "caminos") return [caminos, sigue].filter((estante) => estante.tarjetas.length > 0);
  if (filtro === "libros") return [nuevo];
  if (filtro === "temas") return [temas, personajes];
  return todos;
}

const ALIAS: Record<string, string> = {
  gn: "gn", gen: "gn", genesis: "gn", génesis: "gn",
  ex: "ex", exo: "ex", exodo: "ex", éxodo: "ex",
  sal: "sal", salmo: "sal", salmos: "sal", ps: "sal", psalm: "sal", psalms: "sal",
  jn: "jn", juan: "jn", john: "jn",
  mt: "mt", mateo: "mt", matthew: "mt",
  mc: "mc", mr: "mc", marcos: "mc", mark: "mc",
  lc: "lc", lucas: "lc", luke: "lc",
  ap: "ap", apocalipsis: "ap", revelation: "ap", rev: "ap",
  prov: "prov", proverbios: "prov", proverbs: "prov",
  rom: "rom", romanos: "rom", romans: "rom",
};

export type ResultadoBusqueda = {
  pasaje: { libroId: string; capitulo: number; versiculo: number; etiqueta: string } | null;
  libros: string[];
  temas: Tema[];
  personajes: Personaje[];
};

export function buscar(consulta: string, locale: string): ResultadoBusqueda {
  const texto = consulta.trim().toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  const pasaje = /^([a-záéíóúñ.]+)\s*(\d+)\s*[,.:]\s*(\d+)/iu.exec(consulta.trim());
  let cita: ResultadoBusqueda["pasaje"] = null;
  if (pasaje) {
    const clave = (pasaje[1] ?? "").toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").replace(/\./g, "");
    const libroId = ALIAS[clave];
    if (libroId) {
      const capitulo = Number(pasaje[2]);
      const versiculo = Number(pasaje[3]);
      cita = { libroId, capitulo, versiculo, etiqueta: `${libroId} ${capitulo}:${versiculo}` };
    }
  }
  if (!texto) return { pasaje: null, libros: [], temas: [...TEMAS], personajes: [...PERSONAJES] };
  const libros = Object.entries(ALIAS)
    .filter(([alias, id]) => alias.includes(texto) || id === texto)
    .map(([, id]) => id)
    .filter((id, indice, lista) => lista.indexOf(id) === indice);
  return {
    pasaje: cita,
    libros,
    temas: TEMAS.filter((tema) => tema.titulo.es.toLowerCase().includes(texto) || tema.titulo.en.toLowerCase().includes(texto) || tema.id.includes(texto)),
    personajes: PERSONAJES.filter((persona) => persona.titulo.es.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").includes(texto) || persona.titulo.en.toLowerCase().includes(texto) || persona.id.includes(texto)),
  };
}

export function siguienteEnCola(cola: readonly string[], actual: string | null): string | null {
  if (cola.length === 0) return null;
  if (!actual) return cola[0] ?? null;
  const indice = cola.indexOf(actual);
  if (indice < 0) return cola[0] ?? null;
  return cola[indice + 1] ?? null;
}

export function fundidoMs(reducirMovimiento: boolean): number {
  return reducirMovimiento ? 0 : 480;
}

export function racha(dias: readonly string[], hoy: string): number {
  const conjunto = new Set(dias);
  let cursor = new Date(`${hoy}T12:00:00`);
  if (!conjunto.has(hoy)) cursor.setDate(cursor.getDate() - 1);
  let cuenta = 0;
  for (let i = 0; i < 400; i += 1) {
    const iso = cursor.toISOString().slice(0, 10);
    if (!conjunto.has(iso)) break;
    cuenta += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return cuenta;
}

export function resumenAnio(entrada: {
  segundos: number;
  libros: readonly string[];
  dias: readonly string[];
  hoy: string;
  versiculos: readonly string[];
}): { minutos: number; libros: number; racha: number; versiculo: string | null } {
  const cuentas = new Map<string, number>();
  for (const versiculo of entrada.versiculos) {
    if (!versiculo) continue;
    cuentas.set(versiculo, (cuentas.get(versiculo) ?? 0) + 1);
  }
  let versiculo: string | null = null;
  let maximo = 0;
  for (const [clave, valor] of cuentas) {
    if (valor > maximo) {
      maximo = valor;
      versiculo = clave;
    }
  }
  return {
    minutos: Math.round(Math.max(0, entrada.segundos) / 60),
    libros: new Set(entrada.libros).size,
    racha: racha(entrada.dias, entrada.hoy),
    versiculo: maximo > 1 ? versiculo : versiculo,
  };
}

export function enlaceProfundo(episodioId: string, segundo: number, locale: string): { app: string; web: string } {
  const t = Math.max(0, Math.floor(segundo));
  return {
    app: `audite://escuchar/${episodioId}?t=${t}`,
    web: `/${locale}/oir/${episodioId}?t=${t}`,
  };
}

export type ListaUsuario = {
  id: string;
  nombre: string;
  items: { episodeId: string }[];
  actualizado: string;
};

export function crearLista(nombre: string, ahora: string, id: string): ListaUsuario | null {
  const limpio = nombre.trim();
  if (!limpio) return null;
  return { id, nombre: limpio, items: [], actualizado: ahora };
}

export function añadirALista(lista: ListaUsuario, episodeId: string, ahora: string): ListaUsuario {
  if (lista.items.some((item) => item.episodeId === episodeId)) return lista;
  return { ...lista, items: [...lista.items, { episodeId }], actualizado: ahora };
}

export function reordenarLista(lista: ListaUsuario, desde: number, hacia: number): ListaUsuario {
  if (desde < 0 || hacia < 0 || desde >= lista.items.length || hacia >= lista.items.length || desde === hacia) return lista;
  const items = [...lista.items];
  const [movido] = items.splice(desde, 1);
  if (!movido) return lista;
  items.splice(hacia, 0, movido);
  return { ...lista, items };
}

export function portadaLista(lista: ListaUsuario): string[] {
  return lista.items.slice(0, 4).map((item) => item.episodeId);
}

export function codigoSala(semilla: string): string {
  const limpio = semilla.replace(/[^a-z0-9]/gi, "").toUpperCase();
  const base = (limpio + "AUDITE").slice(0, 6);
  return base.padEnd(6, "A");
}

export function codigoValido(codigo: string): boolean {
  return /^[A-Z0-9]{6}$/.test(codigo.trim().toUpperCase());
}
