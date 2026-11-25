import {
  NOTA_MAX,
  anotacionesVacias,
  fusionarAnotaciones,
  nuevoIdLibros,
  playableEpisodes,
  rangoDeFrase,
  rotuloCapitulo,
  vistaDeMock,
  type AnotacionesLibro,
  type BloqueLibro,
  type CapituloLibro,
  type VistaLector,
} from "@audite/domain";
import { StatusBar } from "expo-status-bar";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, AppState, FlatList, Platform, Pressable, Text, View, useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { clienteLibrosApp } from "../../../libros/cliente";
import { mockDeDesarrollo } from "../../../libros/config";
import { guardarAjustes, guardarAnotacionesLocales, leerAjustes, leerAnotacionesLocales } from "../../../libros/almacen";
import { AJUSTES_INICIALES, temaEfectivo, type AjustesLector, type ModoLector, type TemaLector } from "../../../libros/ajustes";
import { useEstanteria, useLibro, volumenEnMemoria } from "../../../libros/datos";
import { Bloque, usePulso } from "../../../libros/esqueleto";
import { llevaSangria, altoUtilPagina, MARGEN_PAGINA } from "../../../libros/lector-estilo";
import { TAMANOS_LECTOR, TEMAS_LECTOR, acentoLector, tintaSobreAcento } from "../../../libros/lector-temas";
import { BarraSeleccion } from "../../../libros/lector/barra-seleccion";
import { construirItems, primerBloqueDePagina, ubicarAncla, type ItemLector } from "../../../libros/lector/items";
import { MedidorCapitulo } from "../../../libros/lector/medidor";
import { HojaMenu, type FilaIndice } from "../../../libros/lector/menu";
import { CabeceraCapitulo, PaginaLector, TarjetaCorte } from "../../../libros/lector/pagina";
import { TextoBloque, type SeleccionLector } from "../../../libros/lector/texto";
import { useMedidas } from "../../../libros/lector/usar-medidas";
import { rotuloPagina } from "../../../libros/paginacion";
import { listaDeMarcas, unirRangos, type ColorSubrayado, type MarcaLista } from "../../../libros/subrayado";
import { useMobileLibrary } from "../../../state";

type Activo = { bloque: string; inicio: number; fin: number; subrayado: string | null } | null;
type Anclaje = { capId: string | null; bloque: string | null };

const MS_CONTROLES = 180;

function EsperaLector({ fondo, linea }: { fondo: string; linea: string }) {
  const pulso = usePulso();
  return (
    <View accessibilityRole="progressbar" accessibilityLabel="Abriendo el libro" style={{ flex: 1, backgroundColor: fondo, paddingHorizontal: MARGEN_PAGINA, paddingTop: 120, gap: 14 }}>
      <Bloque opacidad={pulso} estilo={{ height: 26, width: "60%", borderRadius: 4, backgroundColor: linea }} />
      {Array.from({ length: 10 }, (_, i) => (
        <Bloque key={i} opacidad={pulso} estilo={{ height: 12, width: i % 5 === 4 ? "55%" : "100%", borderRadius: 4, backgroundColor: linea }} />
      ))}
    </View>
  );
}

export default function Lector() {
  const { slug, c, mock: mockParam } = useLocalSearchParams<{ slug: string; c?: string; mock?: string }>();
  const mock = mockDeDesarrollo(mockParam);
  const library = useMobileLibrary();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const libroId = String(slug);
  const datos = useLibro(libroId);
  const estanteria = useEstanteria();
  const volumen = estanteria.dato?.find((v) => v.id === libroId) ?? volumenEnMemoria(libroId);
  const libro = datos.dato?.lectura ?? null;

  const [cargados, setCargados] = useState<Record<string, CapituloLibro>>({});
  const [bloqueados, setBloqueados] = useState<ReadonlySet<string>>(new Set());
  const [actual, setActual] = useState<string | null>(null);
  const [vista, setVista] = useState<VistaLector>(mock ? vistaDeMock(mock) : "sin-sesion");
  const [token, setToken] = useState<string | null>(null);
  const [anot, setAnot] = useState<AnotacionesLibro>(anotacionesVacias());
  const [listoLocal, setListoLocal] = useState(false);
  const [ajustes, setAjustes] = useState<AjustesLector>(AJUSTES_INICIALES);
  const [controles, setControles] = useState(true);
  const [menu, setMenu] = useState(false);
  const [activo, setActivo] = useState<Activo>(null);
  const [escribiendo, setEscribiendo] = useState(false);
  const [textoNota, setTextoNota] = useState("");
  const [pagina, setPagina] = useState(0);
  const [scrollInfo, setScrollInfo] = useState({ y: 0, contenido: 1, visible: 1 });

  const refAnot = useRef(anot);
  const refActual = useRef(actual);
  const refCargados = useRef(cargados);
  useEffect(() => {
    refAnot.current = anot;
    refActual.current = actual;
    refCargados.current = cargados;
  });
  const ancla = useRef<Anclaje>({ capId: null, bloque: null });
  const pidiendo = useRef(new Set<string>());
  const destino = useRef<string | null>(null);
  const lista = useRef<FlatList<ItemLector>>(null);
  const listaScroll = useRef<FlatList<BloqueLibro>>(null);
  const iniciado = useRef(false);
  const guardaPendiente = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [opacidad] = useState(() => new Animated.Value(1));

  const tema = TEMAS_LECTOR[temaEfectivo(ajustes, library.settings.theme !== "light")];
  const nombreTema: TemaLector = temaEfectivo(ajustes, library.settings.theme !== "light");
  const acento = useMemo(() => acentoLector(volumen?.color ?? "#8A6432", tema), [volumen?.color, tema]);
  const tamano = TAMANOS_LECTOR[ajustes.tam] ?? 18;
  const nativo = Platform.OS !== "web";
  const paginado = ajustes.modo === "paginas";
  const anchoUtil = width - MARGEN_PAGINA * 2;
  const altoPagina = altoUtilPagina(height, insets.top, insets.bottom);
  const episodioOible = playableEpisodes(library.catalog)[0]?.id;
  const titulo = libro?.titulo ?? volumen?.titulo ?? "";

  const guardarLocal = useCallback((nuevo: AnotacionesLibro) => {
    setAnot(nuevo);
    void guardarAnotacionesLocales(libroId, nuevo);
  }, [libroId]);

  const cambiarAjustes = useCallback((parcial: Partial<AjustesLector>) => {
    setAjustes((previo) => {
      const siguiente = { ...previo, ...parcial };
      void guardarAjustes(siguiente);
      return siguiente;
    });
  }, []);

  // Ajustes, anotaciones del dispositivo, sesión y marcas de la cuenta. El adelanto sale de la caché de la ficha.
  useEffect(() => {
    let vivo = true;
    void (async () => {
      const [a, locales, { api, token: t }] = await Promise.all([leerAjustes(), leerAnotacionesLocales(libroId), clienteLibrosApp(mock)]);
      if (!vivo) return;
      setAjustes(a);
      setAnot(locales);
      setToken(t);
      setListoLocal(true);
      if (t || mock) {
        const siguiente = await api.acceso();
        if (vivo) setVista(siguiente);
        const remoto = await api.leerAnotaciones(libroId);
        if (remoto && vivo) {
          const unido = fusionarAnotaciones(locales, remoto);
          setAnot(unido);
          void guardarAnotacionesLocales(libroId, unido);
        }
      }
    })();
    return () => {
      vivo = false;
    };
  }, [libroId, mock]);

  // La app no usa React Compiler. Los avisos del compilador sobre esta función no cambian su comportamiento.
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const traerCapitulo = useCallback(async (id: string): Promise<void> => {
    if (refCargados.current[id] || pidiendo.current.has(id)) return;
    pidiendo.current.add(id);
    const { api } = await clienteLibrosApp(mock, token);
    const r = await api.capitulo(libroId, id);
    pidiendo.current.delete(id);
    if (r.estado === "ok") setCargados((p) => ({ ...p, [id]: r.capitulo }));
    else if (r.estado === "sin-sesion" || r.estado === "sin-permiso") {
      setBloqueados((p) => new Set(p).add(id));
      if (r.estado === "sin-permiso") setVista((v) => (v === "premium" ? v : "gratuito"));
    }
  }, [libroId, mock, token]);

  // Arranque: capítulos del adelanto y punto de lectura (el pedido, el guardado o el primero).
  useEffect(() => {
    if (!libro || !listoLocal || iniciado.current) return;
    iniciado.current = true;
    setCargados(Object.fromEntries(libro.capitulos.map((cap) => [cap.id, cap])));
    const pedido = c && libro.indice.some((e) => e.id === c) ? c : null;
    const progreso = refAnot.current.progreso;
    const guardado = !pedido && progreso && libro.indice.some((e) => e.id === progreso.capitulo_id) ? progreso : null;
    const capId = pedido ?? guardado?.capitulo_id ?? libro.capitulos[0]?.id ?? libro.indice[0]?.id ?? null;
    ancla.current = { capId, bloque: guardado?.bloque_id ?? null };
    setActual(capId);
    if (capId && !libro.capitulos.some((cap) => cap.id === capId)) void traerCapitulo(capId);
  }, [libro, listoLocal, c, traerCapitulo]);

  const indice = useMemo(() => libro?.indice ?? [], [libro]);
  const premium = vista === "premium";
  const capitulosCargados = useMemo(() => indice.flatMap((e) => (cargados[e.id] ? [cargados[e.id] as CapituloLibro] : [])), [indice, cargados]);
  const { medidas, porMedir, registrar } = useMedidas({ libroId, capitulos: capitulosCargados, tam: ajustes.tam, tamano, ancho: anchoUtil, nativo });
  const plan = useMemo(
    () => construirItems({ indice, capitulos: cargados, medidas, tamano, altoPagina, premium, bloqueados }),
    [indice, cargados, medidas, tamano, altoPagina, premium, bloqueados],
  );
  const items = plan.items;

  // El capítulo siguiente se pide con antelación si el lector puede abrirlo.
  const posicion = actual ? indice.findIndex((e) => e.id === actual) : -1;
  useEffect(() => {
    const siguiente = indice[posicion + 1];
    if (!siguiente || cargados[siguiente.id] || bloqueados.has(siguiente.id)) return;
    if (!premium && !siguiente.es_adelanto) return;
    const espera = setTimeout(() => void traerCapitulo(siguiente.id), 300);
    return () => clearTimeout(espera);
  }, [indice, posicion, cargados, bloqueados, premium, traerCapitulo]);

  // En modo páginas, con suscripción, el resto del libro se trae detrás para numerar las páginas del libro entero.
  useEffect(() => {
    if (!premium || !paginado || !libro) return;
    let vivo = true;
    void (async () => {
      for (const e of indice) {
        if (!vivo) return;
        if (refCargados.current[e.id]) continue;
        await traerCapitulo(e.id);
      }
    })();
    return () => {
      vivo = false;
    };
  }, [premium, paginado, libro, indice, traerCapitulo]);

  // Página de espera a la vista: se pide ese capítulo.
  const itemActual = items[Math.min(pagina, Math.max(0, items.length - 1))];
  useEffect(() => {
    // traerCapitulo cambia el estado después de esperar a la red, no dentro del efecto.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (itemActual?.tipo === "cargando") void traerCapitulo(itemActual.capId);
  }, [itemActual, traerCapitulo]);

  const irAPaginaIndice = useCallback((i: number, animado: boolean) => {
    lista.current?.scrollToOffset({ offset: i * width, animated: animado });
    setPagina(i);
  }, [width]);

  // El ancla (capítulo y bloque) manda: al cambiar tamaño, giro, capítulos cargados o destino, se vuelve a ella.
  useEffect(() => {
    if (!paginado || items.length === 0) return;
    const pedido = destino.current;
    const capId = pedido ?? ancla.current.capId;
    const capitulo = capId ? cargados[capId] : undefined;
    const bloqueIdx = pedido ? null : capitulo?.bloques.findIndex((b) => b.id === ancla.current.bloque) ?? -1;
    const i = ubicarAncla(items, capId, bloqueIdx !== null && bloqueIdx >= 0 ? bloqueIdx : null);
    if (i < 0) return;
    if (pedido && items[i]?.tipo === "texto") destino.current = null;
    if (i !== pagina || pedido) {
      const espera = setTimeout(() => irAPaginaIndice(i, false), 0);
      return () => clearTimeout(espera);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, width, paginado]);

  const visible = useRef<{ bloque: string | null }>({ bloque: null });

  const guardarProgreso = useCallback(async (remoto: boolean) => {
    const capituloId = refActual.current;
    if (!capituloId) return;
    const progreso = { libro_id: libroId, capitulo_id: capituloId, bloque_id: visible.current.bloque, ratio: null, updated_at: new Date().toISOString() };
    guardarLocal({ ...refAnot.current, progreso });
    if (remoto && (token || mock)) {
      const { api } = await clienteLibrosApp(mock, token);
      void api.guardarProgreso(libroId, { capitulo_id: capituloId, bloque_id: progreso.bloque_id, ratio: null });
    }
  }, [guardarLocal, libroId, mock, token]);

  useEffect(() => {
    const suscripcion = AppState.addEventListener("change", (estado) => {
      if (estado !== "active") void guardarProgreso(true);
    });
    return () => suscripcion.remove();
  }, [guardarProgreso]);
  useEffect(() => () => void guardarProgreso(true), [guardarProgreso]);

  // La app no usa React Compiler. Los avisos del compilador sobre esta función no cambian su comportamiento.
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const alCambiarPagina = useCallback((i: number) => {
    const item = items[i];
    if (!item) return;
    setPagina(i);
    const capitulo = cargados[item.capId];
    const idx = primerBloqueDePagina(item);
    const bloque = idx !== null ? capitulo?.bloques[idx]?.id ?? null : null;
    ancla.current = { capId: item.capId, bloque };
    visible.current.bloque = bloque;
    if (item.tipo !== "corte" && refActual.current !== item.capId) setActual(item.capId);
    if (guardaPendiente.current) clearTimeout(guardaPendiente.current);
    guardaPendiente.current = setTimeout(() => void guardarProgreso(false), 900);
  }, [items, cargados, guardarProgreso]);

  const alDesplazarPaginas = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== pagina && i >= 0 && i < items.length) alCambiarPagina(i);
  };

  const mostrarControles = useCallback((valor: boolean) => {
    setControles(valor);
    Animated.timing(opacidad, { toValue: valor ? 1 : 0, duration: MS_CONTROLES, useNativeDriver: Platform.OS !== "web" }).start();
  }, [opacidad]);

  const alToqueZona = useCallback((pageX: number) => {
    if (activo) {
      setActivo(null);
      setEscribiendo(false);
      return;
    }
    if (paginado) {
      const f = pageX / width;
      if (f < 0.25 && pagina > 0) return void irAPaginaIndice(pagina - 1, true);
      if (f > 0.75 && pagina < items.length - 1) return void irAPaginaIndice(pagina + 1, true);
    }
    mostrarControles(!controles);
  }, [activo, paginado, width, pagina, items.length, controles, irAPaginaIndice, mostrarControles]);

  // Anotaciones.
  const sincronizar = useCallback(async (tipo: "marcadores" | "subrayados" | "notas", cuerpo: Record<string, unknown>) => {
    if (!token && !mock) return;
    const { api } = await clienteLibrosApp(mock, token);
    await api.crear(libroId, tipo, cuerpo);
  }, [libroId, mock, token]);
  const quitarRemoto = useCallback(async (tipo: "marcadores" | "subrayados" | "notas", id: string) => {
    if (!token && !mock) return;
    const { api } = await clienteLibrosApp(mock, token);
    await api.borrar(libroId, tipo, id);
  }, [libroId, mock, token]);

  const capituloActual = actual ? cargados[actual] ?? null : null;
  const bloqueActivo = capituloActual?.bloques.find((x) => x.id === activo?.bloque) ?? null;
  const marcadoresCap = anot.marcadores.filter((m) => m.capitulo_id === actual);

  function alternarMarcador(bloque: string | null) {
    if (!actual) return;
    const existente = anot.marcadores.find((m) => m.capitulo_id === actual && m.bloque_id === bloque);
    if (existente) {
      guardarLocal({ ...anot, marcadores: anot.marcadores.filter((m) => m.id !== existente.id) });
      void quitarRemoto("marcadores", existente.id);
      return;
    }
    const nuevo = { id: nuevoIdLibros(), libro_id: libroId, capitulo_id: actual, bloque_id: bloque, created_at: new Date().toISOString() };
    guardarLocal({ ...anot, marcadores: [...anot.marcadores, nuevo] });
    void sincronizar("marcadores", nuevo);
  }

  const alMantener = useCallback((bloqueId: string, pos: number, subrayado: string | null) => {
    const bloque = capituloActual?.bloques.find((b) => b.id === bloqueId);
    if (!bloque) return;
    setEscribiendo(false);
    if (subrayado) {
      const existente = refAnot.current.subrayados.find((s) => s.id === subrayado);
      if (existente) setActivo({ bloque: bloqueId, inicio: existente.inicio, fin: existente.fin, subrayado });
      return;
    }
    const rango = rangoDeFrase(bloque.texto, pos);
    setActivo((previo) => {
      if (previo && previo.bloque === bloqueId && !previo.subrayado) return { bloque: bloqueId, ...unirRangos(previo, rango), subrayado: null };
      return { bloque: bloqueId, ...rango, subrayado: null };
    });
  }, [capituloActual]);

  function aplicarColor(color: ColorSubrayado) {
    if (!actual || !activo) return;
    const previo = activo.subrayado ? anot.subrayados.find((s) => s.id === activo.subrayado) : null;
    const nuevo = { id: nuevoIdLibros(), libro_id: libroId, capitulo_id: actual, bloque_id: activo.bloque, inicio: activo.inicio, fin: activo.fin, color, created_at: new Date().toISOString() };
    const sinPrevio = previo ? anot.subrayados.filter((s) => s.id !== previo.id) : anot.subrayados;
    // Un subrayado que cambia de color se crea de nuevo con el color elegido. Sus notas pasan al subrayado nuevo.
    const notas = previo ? anot.notas.map((n) => (n.subrayado_id === previo.id ? { ...n, subrayado_id: nuevo.id } : n)) : anot.notas;
    guardarLocal({ ...anot, subrayados: [...sinPrevio, nuevo], notas });
    void (async () => {
      if (previo) await quitarRemoto("subrayados", previo.id);
      await sincronizar("subrayados", nuevo);
    })();
    setActivo({ ...activo, subrayado: nuevo.id });
  }

  function quitarSubrayado() {
    if (!activo?.subrayado) return;
    const id = activo.subrayado;
    guardarLocal({ ...anot, subrayados: anot.subrayados.filter((s) => s.id !== id) });
    void quitarRemoto("subrayados", id);
    setActivo(null);
  }

  function guardarNota() {
    const cuerpo = textoNota.trim().slice(0, NOTA_MAX);
    if (!cuerpo || !activo || !actual) return;
    const nueva = { id: nuevoIdLibros(), libro_id: libroId, capitulo_id: actual, bloque_id: activo.bloque, subrayado_id: activo.subrayado, texto: cuerpo, created_at: new Date().toISOString() };
    guardarLocal({ ...anot, notas: [...anot.notas, nueva] });
    void sincronizar("notas", nueva);
    setTextoNota("");
    setEscribiendo(false);
    setActivo(null);
  }

  // Menú: índice con páginas y lista de marcas.
  const filasIndice: FilaIndice[] = indice.map((entrada) => ({ entrada, pagina: plan.inicios[entrada.id] ?? null, bloqueada: !premium && !entrada.es_adelanto }));
  const marcas = useMemo(
    () => listaDeMarcas(anot, (capId, bloqueId) => cargados[capId]?.bloques.find((b) => b.id === bloqueId)?.texto ?? null),
    [anot, cargados],
  );
  const rotuloMarca = useCallback((m: MarcaLista) => {
    const e = indice.find((x) => x.id === m.capitulo_id);
    return e ? rotuloCapitulo(e) : "";
  }, [indice]);

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const irACapitulo = useCallback((id: string, bloqueId: string | null = null) => {
    setMenu(false);
    setActivo(null);
    setEscribiendo(false);
    setActual(id);
    ancla.current = { capId: id, bloque: bloqueId };
    visible.current.bloque = bloqueId;
    if (paginado) {
      destino.current = bloqueId ? null : id;
      const capitulo = refCargados.current[id];
      const bloqueIdx = bloqueId ? capitulo?.bloques.findIndex((b) => b.id === bloqueId) ?? -1 : -1;
      const i = ubicarAncla(items, id, bloqueIdx >= 0 ? bloqueIdx : null);
      if (i >= 0) {
        destino.current = null;
        setTimeout(() => irAPaginaIndice(i, false), 80);
      }
    }
    if (!refCargados.current[id]) void traerCapitulo(id);
    mostrarControles(false);
  }, [paginado, items, irAPaginaIndice, traerCapitulo, mostrarControles]);

  const alBorrarMarca = (m: MarcaLista) => {
    if (m.tipo === "subrayado") {
      guardarLocal({ ...anot, subrayados: anot.subrayados.filter((s) => s.id !== m.id) });
      void quitarRemoto("subrayados", m.id);
    } else if (m.tipo === "nota") {
      guardarLocal({ ...anot, notas: anot.notas.filter((n) => n.id !== m.id) });
      void quitarRemoto("notas", m.id);
    } else {
      guardarLocal({ ...anot, marcadores: anot.marcadores.filter((x) => x.id !== m.id) });
      void quitarRemoto("marcadores", m.id);
    }
  };

  const seleccion: SeleccionLector = activo && !activo.subrayado ? { bloque: activo.bloque, inicio: activo.inicio, fin: activo.fin } : null;
  const subrayadoActivo = activo?.subrayado ? anot.subrayados.find((s) => s.id === activo.subrayado) ?? null : null;

  // Número de página que se muestra.
  const numeroPagina = paginado ? itemActual?.numero ?? 1 : Math.floor(scrollInfo.y / Math.max(1, scrollInfo.visible)) + 1;
  const totalPaginas = paginado ? plan.total : Math.max(1, Math.ceil(scrollInfo.contenido / Math.max(1, scrollInfo.visible)));
  const etiqueta = totalPaginas > 0 ? rotuloPagina(Math.min(numeroPagina, totalPaginas), totalPaginas) : "";
  const hayMarcadorPagina = paginado
    ? (() => {
        const idx = primerBloqueDePagina(itemActual);
        const id = idx !== null ? capituloActual?.bloques[idx]?.id : null;
        return id ? anot.marcadores.some((m) => m.bloque_id === id) : false;
      })()
    : marcadoresCap.some((m) => m.bloque_id === null);

  const alMarcarPagina = () => {
    if (paginado) alternarMarcador(visible.current.bloque);
    else alternarMarcador(null);
  };

  if (!libro) {
    if (datos.cargando || !listoLocal) return <><Stack.Screen options={{ headerShown: false }} /><EsperaLector fondo={tema.bg} linea={tema.line} /></>;
    return (
      <View style={{ flex: 1, backgroundColor: tema.bg, padding: 22, paddingTop: insets.top + 60 }}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={{ color: tema.muted, fontSize: 16, lineHeight: 24 }}>La lectura de este volumen en Audite se está preparando.</Text>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={{ marginTop: 20, minHeight: 48, justifyContent: "center" }}><Text style={{ color: acento, fontSize: 16 }}>Volver</Text></Pressable>
      </View>
    );
  }

  const entradaActual = indice.find((e) => e.id === actual) ?? null;
  const siguienteScroll = indice[posicion + 1] ?? null;
  const anteriorScroll = posicion > 0 ? indice[posicion - 1] ?? null : null;
  const finDeAdelanto = Boolean(capituloActual) && !premium && siguienteScroll !== null && !siguienteScroll.es_adelanto;
  const botonCircular = { width: 44, height: 44, borderRadius: 22, alignItems: "center" as const, justifyContent: "center" as const };
  const zonaSuperior = insets.top + 56;
  const zonaInferior = insets.bottom + 56;

  return (
    <View style={{ flex: 1, backgroundColor: tema.bg }}>
      <Stack.Screen options={{ headerShown: false, contentStyle: { backgroundColor: tema.bg } }} />
      <StatusBar style={tema.oscuro ? "light" : "dark"} />

      {paginado ? (
        <FlatList
          ref={lista}
          key={`p-${Math.round(width)}`}
          data={items}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(i) => i.clave}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          scrollEventThrottle={48}
          onScroll={alDesplazarPaginas}
          initialNumToRender={2}
          maxToRenderPerBatch={2}
          windowSize={3}
          renderItem={({ item }) => (
            <PaginaLector
              item={item}
              capitulo={cargados[item.capId]}
              ancho={width}
              alto={height}
              margen={MARGEN_PAGINA}
              superior={zonaSuperior}
              inferior={zonaInferior}
              tamano={tamano}
              tema={tema}
              acento={acento}
              subrayados={anot.subrayados}
              marcadores={anot.marcadores}
              seleccion={seleccion}
              vista={vista}
              episodioOible={episodioOible}
              alToque={alToqueZona}
              alMantener={alMantener}
              alAbrirEpisodio={() => router.push("/ahora")}
              alSuscribir={() => router.push("/suscripcion")}
              alEntrar={() => router.push("/entrar")}
            />
          )}
        />
      ) : (
        <FlatList
          ref={listaScroll}
          key={actual ?? "libro"}
          data={bloqueados.has(actual ?? "") ? [] : capituloActual?.bloques ?? []}
          keyExtractor={(b) => b.id}
          onScroll={(e) => setScrollInfo({ y: e.nativeEvent.contentOffset.y, contenido: e.nativeEvent.contentSize.height, visible: e.nativeEvent.layoutMeasurement.height })}
          scrollEventThrottle={64}
          onContentSizeChange={(_, h) => setScrollInfo((p) => ({ ...p, contenido: h }))}
          onLayout={(e) => setScrollInfo((p) => ({ ...p, visible: e.nativeEvent.layout.height }))}
          contentContainerStyle={{ paddingTop: zonaSuperior, paddingBottom: zonaInferior + 120, paddingHorizontal: MARGEN_PAGINA }}
          initialNumToRender={14}
          ListHeaderComponent={capituloActual ? (
            <Pressable accessible={false} onPress={(e) => alToqueZona(e.nativeEvent.pageX)}>
              <CabeceraCapitulo capitulo={capituloActual} tamano={tamano} tema={tema} acento={acento} />
            </Pressable>
          ) : (
            <Text style={{ color: tema.muted, fontSize: 13 }}>{entradaActual ? rotuloCapitulo(entradaActual) : libro.libro_biblico}</Text>
          )}
          renderItem={({ item, index }) => (
            <View style={{ marginTop: item.tipo === "subtitulo" ? 22 : item.tipo === "pasaje" ? 10 : 12 }}>
              <TextoBloque
                bloque={item}
                tamano={tamano}
                tema={tema}
                acento={acento}
                sangria={llevaSangria(item, capituloActual?.bloques[index - 1])}
                subrayados={anot.subrayados.filter((s) => s.bloque_id === item.id)}
                seleccion={seleccion}
                marcado={marcadoresCap.some((m) => m.bloque_id === item.id)}
                justificado
                episodioOible={episodioOible}
                alToque={alToqueZona}
                alMantener={(pos, sub) => alMantener(item.id, pos, sub)}
                alAbrirEpisodio={() => router.push("/ahora")}
              />
              {anot.notas.filter((n) => n.bloque_id === item.id).map((nota) => (
                <View key={nota.id} style={{ marginTop: 6, paddingVertical: 8, paddingHorizontal: 12, borderLeftWidth: 2, borderLeftColor: acento, backgroundColor: tema.card }}>
                  <Text style={{ color: tema.muted, fontSize: 12 }}>{new Date(nota.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}</Text>
                  <Text style={{ color: tema.ink, fontSize: 15, lineHeight: 21 }}>{nota.texto}</Text>
                </View>
              ))}
            </View>
          )}
          ListFooterComponent={
            <View style={{ gap: 16, marginTop: 24 }}>
              {bloqueados.has(actual ?? "") || finDeAdelanto ? <TarjetaCorte tema={tema} acento={acento} vista={vista} alSuscribir={() => router.push("/suscripcion")} alEntrar={() => router.push("/entrar")} /> : null}
              {capituloActual && !bloqueados.has(actual ?? "") ? (
                <View style={{ flexDirection: "row", gap: 10 }}>
                  {anteriorScroll ? <Pressable accessibilityRole="button" style={{ flex: 1, minHeight: 44, borderRadius: 999, borderWidth: 1, borderColor: tema.line, paddingHorizontal: 14, justifyContent: "center" }} onPress={() => irACapitulo(anteriorScroll.id)}><Text numberOfLines={1} style={{ color: tema.ink }}>← {anteriorScroll.titulo}</Text></Pressable> : <View style={{ flex: 1 }} />}
                  {siguienteScroll && !finDeAdelanto ? <Pressable accessibilityRole="button" style={{ flex: 1, minHeight: 44, borderRadius: 999, borderWidth: 1, borderColor: tema.line, paddingHorizontal: 14, justifyContent: "center" }} onPress={() => irACapitulo(siguienteScroll.id)}><Text numberOfLines={1} style={{ color: tema.ink }}>{siguienteScroll.titulo} →</Text></Pressable> : <View style={{ flex: 1 }} />}
                </View>
              ) : null}
            </View>
          }
        />
      )}

      {nativo && paginado && porMedir[0] ? (
        <MedidorCapitulo key={`${porMedir[0].id}-${ajustes.tam}-${Math.round(anchoUtil)}`} capitulo={porMedir[0]} tamano={tamano} ancho={anchoUtil} tema={tema} justificado alTerminar={registrar} />
      ) : null}

      {/* Barra superior: cerrar, título pequeño y marcador. */}
      <Animated.View style={{ position: "absolute", top: 0, left: 0, right: 0, paddingTop: insets.top + 4, paddingHorizontal: 8, height: zonaSuperior, flexDirection: "row", alignItems: "center", backgroundColor: tema.barra, opacity: opacidad, pointerEvents: controles ? "auto" : "none" }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Cerrar el libro" onPress={() => router.back()} style={botonCircular}>
          <Text style={{ color: tema.ink, fontSize: 22 }}>✕</Text>
        </Pressable>
        <Text numberOfLines={1} accessibilityRole="header" style={{ flex: 1, textAlign: "center", color: tema.tenue, fontSize: 13, letterSpacing: 0.4 }}>{titulo}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={hayMarcadorPagina ? "Quitar el marcador" : "Poner un marcador"} accessibilityState={{ selected: hayMarcadorPagina }} onPress={alMarcarPagina} style={botonCircular}>
          <View style={{ width: 14, height: 20, borderWidth: 2, borderColor: acento, borderBottomWidth: 0, backgroundColor: hayMarcadorPagina ? acento : "transparent" }} />
        </Pressable>
      </Animated.View>

      {/* Página actual: siempre a la vista. Con los controles puestos lleva el botón del menú a la derecha. */}
      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: zonaInferior, paddingBottom: insets.bottom, justifyContent: "center", pointerEvents: "box-none" }}>
        <Animated.View style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0, backgroundColor: tema.barra, opacity: opacidad }} />
        <Text accessibilityLiveRegion="polite" style={{ textAlign: "center", color: tema.tenue, fontSize: 13, letterSpacing: 0.3 }}>{etiqueta}</Text>
        <Animated.View style={{ position: "absolute", right: 12, bottom: insets.bottom + 4, opacity: opacidad, pointerEvents: controles ? "auto" : "none" }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Menú del libro: índice, ajustes y marcas" onPress={() => setMenu(true)} style={[botonCircular, { backgroundColor: acento }]}>
            <View style={{ gap: 4 }}>
              {[0, 1, 2].map((i) => <View key={i} style={{ width: 18, height: 2, borderRadius: 1, backgroundColor: tintaSobreAcento(acento) }} />)}
            </View>
          </Pressable>
        </Animated.View>
      </View>

      {activo && (bloqueActivo || capituloActual) ? (
        <BarraSeleccion
          tema={tema}
          acento={acento}
          colorActual={subrayadoActivo?.color ?? null}
          hayRango={Boolean(activo && !activo.subrayado)}
          marcado={marcadoresCap.some((m) => m.bloque_id === activo.bloque)}
          notas={anot.notas.filter((n) => n.bloque_id === activo.bloque).map((n) => ({ id: n.id, texto: n.texto }))}
          escribiendo={escribiendo}
          textoNota={textoNota}
          inferior={insets.bottom}
          alColor={aplicarColor}
          alQuitarSubrayado={quitarSubrayado}
          alAmpliarBloque={() => bloqueActivo && setActivo({ bloque: bloqueActivo.id, inicio: 0, fin: bloqueActivo.texto.length, subrayado: null })}
          alMarcar={() => alternarMarcador(activo.bloque)}
          alAnotar={() => setEscribiendo(true)}
          alGuardarNota={guardarNota}
          alCancelarNota={() => { setEscribiendo(false); setTextoNota(""); }}
          alCambiarNota={setTextoNota}
          alBorrarNota={(id) => { guardarLocal({ ...anot, notas: anot.notas.filter((x) => x.id !== id) }); void quitarRemoto("notas", id); }}
          alCerrar={() => { setActivo(null); setEscribiendo(false); }}
        />
      ) : null}

      <HojaMenu
        visible={menu}
        tema={tema}
        acento={acento}
        titulo={titulo}
        volumen={volumen?.volumen ?? datos.dato?.ficha.volumen ?? 0}
        pagina={Math.min(numeroPagina, Math.max(1, totalPaginas))}
        total={totalPaginas}
        filas={filasIndice}
        actual={actual}
        marcas={marcas}
        rotuloMarca={rotuloMarca}
        tam={ajustes.tam}
        maxTam={TAMANOS_LECTOR.length - 1}
        temaActual={nombreTema}
        modo={ajustes.modo}
        alCerrar={() => setMenu(false)}
        alIrCapitulo={(id) => irACapitulo(id)}
        alIrMarca={(m) => irACapitulo(m.capitulo_id, m.bloque_id)}
        alBorrarMarca={alBorrarMarca}
        alTam={(delta) => cambiarAjustes({ tam: Math.max(0, Math.min(TAMANOS_LECTOR.length - 1, ajustes.tam + delta)) })}
        alTema={(t: TemaLector) => cambiarAjustes({ tema: t, noche: t === "noche" })}
        alModo={(m: ModoLector) => cambiarAjustes({ modo: m })}
      />
    </View>
  );
}
