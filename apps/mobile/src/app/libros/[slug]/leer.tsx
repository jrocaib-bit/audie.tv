import {
  NOTA_MAX,
  PRECIO,
  aplicarSubrayados,
  anotacionesVacias,
  fusionarAnotaciones,
  nuevoIdLibros,
  playableEpisodes,
  rangoDeFrase,
  rotuloCapitulo,
  trozosDeHtml,
  vistaDeMock,
  type AnotacionesLibro,
  type BloqueLibro,
  type CapituloLibro,
  type LibroCortado,
  type VistaLector,
} from "@audite/domain";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ActivityIndicator, AppState, FlatList, Modal, Pressable, Text, TextInput, View } from "react-native";
import { clienteLibrosApp } from "../../../libros/cliente";
import { mockDeDesarrollo } from "../../../libros/config";
import { guardarAjustes, guardarAnotacionesLocales, leerAjustes, leerAnotacionesLocales } from "../../../libros/almacen";
import { LETRA, TAMANOS } from "../../../libros/estilos";
import { partirEnFrases } from "../../../libros/frases";
import { dark, light, ui } from "../../../theme";
import { useMobileLibrary } from "../../../state";

const MARCA = "rgba(201,169,110,0.32)";

type Activo = { bloque: string; pos: number | null; subrayado: string | null } | null;

export default function Lector() {
  const { slug, c, b, mock: mockParam } = useLocalSearchParams<{ slug: string; c?: string; b?: string; mock?: string }>();
  const mock = mockDeDesarrollo(mockParam);
  const library = useMobileLibrary();
  const router = useRouter();
  const libroId = String(slug);
  const [libro, setLibro] = useState<LibroCortado | null | undefined>(undefined);
  const [cargados, setCargados] = useState<Record<string, CapituloLibro>>({});
  const [actual, setActual] = useState<string | null>(null);
  const [bloqueado, setBloqueado] = useState<string | null>(null);
  const [vista, setVista] = useState<VistaLector>(mock ? vistaDeMock(mock) : "sin-sesion");
  const [token, setToken] = useState<string | null>(null);
  const [anot, setAnot] = useState<AnotacionesLibro>(anotacionesVacias());
  const [tam, setTam] = useState(1);
  const [noche, setNoche] = useState<boolean | null>(null);
  const [indiceAbierto, setIndiceAbierto] = useState(false);
  const [activo, setActivo] = useState<Activo>(null);
  const [escribiendo, setEscribiendo] = useState(false);
  const [textoNota, setTextoNota] = useState("");
  const [cargando, setCargando] = useState(false);
  const refAnot = useRef(anot);
  refAnot.current = anot;
  const refActual = useRef(actual);
  refActual.current = actual;
  const visible = useRef<{ bloque: string | null; indice: number }>({ bloque: null, indice: 0 });

  const esNoche = noche ?? library.settings.theme !== "light";
  const colors = esNoche ? dark : light;
  const episodioOible = playableEpisodes(library.catalog)[0]?.id;

  const guardarLocal = useCallback((datos: AnotacionesLibro) => {
    setAnot(datos);
    void guardarAnotacionesLocales(libroId, datos);
  }, [libroId]);

  // Carga inicial: ajustes, anotaciones del dispositivo, sesión y adelanto desde la API.
  useEffect(() => {
    let vivo = true;
    void (async () => {
      const [ajustes, locales, { api, token: t }] = await Promise.all([leerAjustes(), leerAnotacionesLocales(libroId), clienteLibrosApp(mock)]);
      if (!vivo) return;
      setTam(ajustes.tam);
      setNoche(ajustes.noche);
      setAnot(locales);
      setToken(t);
      const dato = await api.libro(libroId);
      if (!vivo) return;
      if (!dato?.lectura) {
        setLibro(null);
        return;
      }
      setLibro(dato.lectura);
      setCargados(Object.fromEntries(dato.lectura.capitulos.map((cap) => [cap.id, cap])));
      const primero = dato.lectura.capitulos[0]?.id ?? dato.lectura.indice[0]?.id ?? null;
      const pedido = c && dato.lectura.indice.some((e) => e.id === c) ? c : null;
      setActual(pedido && dato.lectura.capitulos.some((cap) => cap.id === pedido) ? pedido : primero);
      if (t || mock) {
        setVista(await api.acceso());
        const remoto = await api.leerAnotaciones(libroId);
        if (remoto && vivo) {
          const unido = fusionarAnotaciones(locales, remoto);
          setAnot(unido);
          void guardarAnotacionesLocales(libroId, unido);
        }
      }
      if (pedido && !dato.lectura.capitulos.some((cap) => cap.id === pedido)) {
        setCargando(true);
        const r = await api.capitulo(libroId, pedido);
        if (!vivo) return;
        setCargando(false);
        setActual(pedido);
        if (r.estado === "ok") setCargados((p) => ({ ...p, [pedido]: r.capitulo }));
        else if (r.estado === "sin-sesion" || r.estado === "sin-permiso") setBloqueado(pedido);
      }
    })();
    return () => {
      vivo = false;
    };
  }, [libroId, c, mock]);

  const guardarProgreso = useCallback(async () => {
    const capituloId = refActual.current;
    if (!capituloId) return;
    const progreso = { libro_id: libroId, capitulo_id: capituloId, bloque_id: visible.current.bloque, ratio: null, updated_at: new Date().toISOString() };
    guardarLocal({ ...refAnot.current, progreso });
    if (token || mock) {
      const { api } = await clienteLibrosApp(mock, token);
      void api.guardarProgreso(libroId, { capitulo_id: capituloId, bloque_id: progreso.bloque_id, ratio: null });
    }
  }, [guardarLocal, libroId, mock, token]);

  useEffect(() => {
    const suscripcion = AppState.addEventListener("change", (estado) => {
      if (estado !== "active") void guardarProgreso();
    });
    return () => suscripcion.remove();
  }, [guardarProgreso]);
  useEffect(() => () => void guardarProgreso(), [guardarProgreso]);

  const irA = useCallback(async (id: string) => {
    if (!libro) return;
    void guardarProgreso();
    setIndiceAbierto(false);
    setActivo(null);
    setEscribiendo(false);
    setBloqueado(null);
    setActual(id);
    if (cargados[id]) return;
    setCargando(true);
    const { api } = await clienteLibrosApp(mock, token);
    const r = await api.capitulo(libroId, id);
    setCargando(false);
    if (r.estado === "ok") setCargados((p) => ({ ...p, [id]: r.capitulo }));
    else if (r.estado === "sin-sesion" || r.estado === "sin-permiso") {
      setBloqueado(id);
      if (r.estado === "sin-permiso") setVista((v) => (v === "premium" ? v : "gratuito"));
    }
  }, [cargados, guardarProgreso, libro, libroId, mock, token]);

  const capitulo = actual ? cargados[actual] ?? null : null;
  const entrada = libro?.indice.find((e) => e.id === actual) ?? null;
  const posicion = libro && actual ? libro.indice.findIndex((e) => e.id === actual) : -1;
  const siguiente = libro?.indice[posicion + 1] ?? null;
  const anterior = posicion > 0 ? libro?.indice[posicion - 1] ?? null : null;
  const finDeAdelanto = Boolean(capitulo) && vista !== "premium" && siguiente !== null && !siguiente.es_adelanto;

  const sincronizar = useCallback(async (tipo: "marcadores" | "subrayados" | "notas", cuerpo: Record<string, unknown>) => {
    if (!token && !mock) return;
    const { api } = await clienteLibrosApp(mock, token);
    void api.crear(libroId, tipo, cuerpo);
  }, [libroId, mock, token]);
  const quitarRemoto = useCallback(async (tipo: "marcadores" | "subrayados" | "notas", id: string) => {
    if (!token && !mock) return;
    const { api } = await clienteLibrosApp(mock, token);
    void api.borrar(libroId, tipo, id);
  }, [libroId, mock, token]);

  const marcadoresCap = anot.marcadores.filter((m) => m.capitulo_id === actual);
  const marcadorCapitulo = marcadoresCap.find((m) => m.bloque_id === null);

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

  function subrayar(bloque: BloqueLibro, rango: { inicio: number; fin: number }, conNota = false) {
    if (!actual) return;
    const nuevo = { id: nuevoIdLibros(), libro_id: libroId, capitulo_id: actual, bloque_id: bloque.id, inicio: rango.inicio, fin: rango.fin, color: "oro", created_at: new Date().toISOString() };
    guardarLocal({ ...anot, subrayados: [...anot.subrayados, nuevo] });
    void sincronizar("subrayados", nuevo);
    setActivo({ bloque: bloque.id, pos: null, subrayado: nuevo.id });
    if (conNota) setEscribiendo(true);
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

  const alVer = useRef(({ viewableItems }: { viewableItems: { item: unknown; index?: number | null; isViewable: boolean }[] }) => {
    const primero = viewableItems.find((v) => v.isViewable && v.item && typeof (v.item as BloqueLibro).id === "string");
    if (primero) visible.current = { bloque: (primero.item as BloqueLibro).id, indice: primero.index ?? 0 };
  });

  if (libro === undefined) return <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: "center" }}><ActivityIndicator color={colors.accent} /></View>;
  if (libro === null) return <View style={{ flex: 1, backgroundColor: colors.bg, padding: 22 }}><Text style={[ui.body, { color: colors.muted }]}>La lectura de este volumen en Audite se está preparando.</Text></View>;

  const boton = { minHeight: 44, minWidth: 44, borderRadius: 999, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 14, alignItems: "center" as const, justifyContent: "center" as const };
  const cuerpoSize = TAMANOS[tam] ?? 18;
  const bloqueActivo = capitulo?.bloques.find((x) => x.id === activo?.bloque) ?? null;

  const corte = (tipo: "fin-adelanto" | "capitulo") => (
    <View accessibilityLabel="El libro sigue aquí" style={{ margin: 22, padding: 22, borderRadius: 24, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, gap: 10 }}>
      <Text style={{ color: colors.accent, fontSize: 12, letterSpacing: 2, textTransform: "uppercase" }}>Audite Premium</Text>
      <Text accessibilityRole="header" style={{ color: colors.ink, fontFamily: LETRA, fontSize: 30 }}>El libro sigue aquí</Text>
      <Text style={[ui.body, { color: colors.muted }]}>
        {vista === "gratuito"
          ? "Tu cuenta ya está creada. Con la suscripción, el libro entero se abre y tus notas lo acompañan."
          : "El resto del libro se abre con la suscripción de Audite. Prueba 7 días gratis y sigue leyendo donde lo dejaste."}
      </Text>
      <Text style={{ color: colors.muted, fontSize: 13 }}>Después, {PRECIO.anio} al año o {PRECIO.mes} al mes.</Text>
      <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }} accessibilityLabel={tipo}>
        <Pressable accessibilityRole="button" onPress={() => router.push("/suscripcion")} style={[ui.button, { backgroundColor: colors.accent }]}>
          <Text style={[ui.buttonText, { color: colors.accentInk }]}>Prueba {PRECIO.pruebaDias} días gratis</Text>
        </Pressable>
        {vista === "sin-sesion" ? (
          <Pressable accessibilityRole="button" onPress={() => router.push("/entrar")} style={[ui.button, { borderWidth: 1, borderColor: colors.line }]}>
            <Text style={[ui.buttonText, { color: colors.ink }]}>Entrar</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingVertical: 8, flexWrap: "wrap", alignItems: "center" }}>
        <Pressable accessibilityRole="button" style={boton} onPress={() => setIndiceAbierto(true)}><Text style={{ color: colors.ink }}>Índice</Text></Pressable>
        <View style={{ flex: 1 }} />
        <Pressable accessibilityRole="button" accessibilityLabel="Letra más pequeña" disabled={tam === 0} style={[boton, { opacity: tam === 0 ? 0.4 : 1 }]} onPress={() => { const n = Math.max(0, tam - 1); setTam(n); void guardarAjustes({ tam: n, noche }); }}><Text style={{ color: colors.ink }}>A−</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Letra más grande" disabled={tam === TAMANOS.length - 1} style={[boton, { opacity: tam === TAMANOS.length - 1 ? 0.4 : 1 }]} onPress={() => { const n = Math.min(TAMANOS.length - 1, tam + 1); setTam(n); void guardarAjustes({ tam: n, noche }); }}><Text style={{ color: colors.ink }}>A+</Text></Pressable>
        <Pressable accessibilityRole="button" style={boton} onPress={() => { const n = !esNoche; setNoche(n); void guardarAjustes({ tam, noche: n }); }}><Text style={{ color: colors.ink }}>{esNoche ? "Día" : "Noche"}</Text></Pressable>
      </View>

      <FlatList
        key={actual ?? "libro"}
        data={bloqueado === actual ? [] : capitulo?.bloques ?? []}
        keyExtractor={(bloque) => bloque.id}
        onViewableItemsChanged={alVer.current}
        viewabilityConfig={{ itemVisiblePercentThreshold: 40 }}
        contentContainerStyle={{ paddingBottom: 160 }}
        initialNumToRender={14}
        ListHeaderComponent={
          <View style={{ paddingHorizontal: 22, paddingTop: 12, gap: 6 }}>
            <Text style={{ color: colors.accent, fontSize: 12, letterSpacing: 2, textTransform: "uppercase" }}>{entrada ? rotuloCapitulo(entrada) : libro.libro_biblico}</Text>
            <Text accessibilityRole="header" style={{ color: colors.ink, fontFamily: LETRA, fontSize: 34, lineHeight: 38 }}>{entrada?.titulo ?? libro.titulo}</Text>
            <Text style={{ color: colors.muted, fontSize: 13 }}>{libro.titulo}</Text>
            <Pressable accessibilityRole="button" accessibilityState={{ selected: Boolean(marcadorCapitulo) }} style={[boton, { alignSelf: "flex-start", marginTop: 8 }]} onPress={() => alternarMarcador(null)}>
              <Text style={{ color: colors.ink }}>{marcadorCapitulo ? "Capítulo marcado" : "Marcar capítulo"}</Text>
            </Pressable>
            {cargando ? <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} /> : null}
          </View>
        }
        renderItem={({ item }) => (
          <BloqueApp
            bloque={item}
            tamano={cuerpoSize}
            colors={colors}
            activo={activo?.bloque === item.id}
            marcado={marcadoresCap.some((m) => m.bloque_id === item.id)}
            subrayados={anot.subrayados.filter((s) => s.bloque_id === item.id)}
            notas={anot.notas.filter((n) => n.bloque_id === item.id)}
            episodioOible={episodioOible}
            alActivar={(pos, subrayado) => setActivo(activo?.bloque === item.id && activo.pos === pos ? null : { bloque: item.id, pos, subrayado })}
            alAbrirEpisodio={() => router.push("/ahora")}
          />
        )}
        ListFooterComponent={
          <View>
            {bloqueado === actual ? corte("capitulo") : null}
            {finDeAdelanto && bloqueado !== actual ? corte("fin-adelanto") : null}
            {capitulo && bloqueado !== actual ? (
              <View style={{ flexDirection: "row", gap: 10, paddingHorizontal: 22, marginTop: 24 }}>
                {anterior ? <Pressable accessibilityRole="button" style={[boton, { flex: 1 }]} onPress={() => void irA(anterior.id)}><Text numberOfLines={1} style={{ color: colors.ink }}>← {anterior.titulo}</Text></Pressable> : <View style={{ flex: 1 }} />}
                {siguiente && !finDeAdelanto ? <Pressable accessibilityRole="button" style={[boton, { flex: 1 }]} onPress={() => void irA(siguiente.id)}><Text numberOfLines={1} style={{ color: colors.ink }}>{siguiente.titulo} →</Text></Pressable> : <View style={{ flex: 1 }} />}
              </View>
            ) : null}
          </View>
        }
      />

      {activo && bloqueActivo ? (
        <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: 14, gap: 10, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.line }}>
          {escribiendo ? (
            <>
              <TextInput value={textoNota} onChangeText={setTextoNota} maxLength={NOTA_MAX} multiline autoFocus placeholder="Nota" placeholderTextColor={colors.muted} style={{ minHeight: 72, color: colors.ink, borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 12, fontSize: 16 }} />
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Pressable accessibilityRole="button" style={[boton, { backgroundColor: colors.accent }]} onPress={guardarNota}><Text style={{ color: colors.accentInk }}>Guardar nota</Text></Pressable>
                <Pressable accessibilityRole="button" style={boton} onPress={() => { setEscribiendo(false); setTextoNota(""); }}><Text style={{ color: colors.ink }}>Cancelar</Text></Pressable>
              </View>
            </>
          ) : (
            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
              <Pressable accessibilityRole="button" style={boton} onPress={() => alternarMarcador(activo.bloque)}><Text style={{ color: colors.ink }}>{marcadoresCap.some((m) => m.bloque_id === activo.bloque) ? "Quitar marcador" : "Marcar"}</Text></Pressable>
              {activo.subrayado ? (
                <Pressable accessibilityRole="button" style={boton} onPress={() => { const id = activo.subrayado as string; guardarLocal({ ...anot, subrayados: anot.subrayados.filter((s) => s.id !== id) }); void quitarRemoto("subrayados", id); setActivo(null); }}><Text style={{ color: colors.ink }}>Quitar subrayado</Text></Pressable>
              ) : (
                <>
                  <Pressable accessibilityRole="button" style={boton} onPress={() => subrayar(bloqueActivo, rangoDeFrase(bloqueActivo.texto, activo.pos ?? 0))}><Text style={{ color: colors.ink }}>Subrayar frase</Text></Pressable>
                  <Pressable accessibilityRole="button" style={boton} onPress={() => subrayar(bloqueActivo, { inicio: 0, fin: bloqueActivo.texto.length })}><Text style={{ color: colors.ink }}>Subrayar bloque</Text></Pressable>
                </>
              )}
              <Pressable accessibilityRole="button" style={boton} onPress={() => setEscribiendo(true)}><Text style={{ color: colors.ink }}>Anotar</Text></Pressable>
              {anot.notas.filter((n) => n.bloque_id === activo.bloque).map((n) => (
                <Pressable key={n.id} accessibilityRole="button" style={boton} onPress={() => { guardarLocal({ ...anot, notas: anot.notas.filter((x) => x.id !== n.id) }); void quitarRemoto("notas", n.id); }}><Text style={{ color: colors.ink }}>Borrar nota</Text></Pressable>
              ))}
              <Pressable accessibilityRole="button" style={boton} onPress={() => setActivo(null)}><Text style={{ color: colors.ink }}>Cerrar</Text></Pressable>
            </View>
          )}
        </View>
      ) : null}

      <Modal visible={indiceAbierto} animationType="slide" transparent onRequestClose={() => setIndiceAbierto(false)}>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.55)" }}>
          <View style={{ maxHeight: "78%", backgroundColor: colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <Text accessibilityRole="header" style={{ color: colors.ink, fontFamily: LETRA, fontSize: 26 }}>Índice</Text>
              <Pressable accessibilityRole="button" style={boton} onPress={() => setIndiceAbierto(false)}><Text style={{ color: colors.ink }}>Cerrar</Text></Pressable>
            </View>
            <FlatList
              data={libro.indice}
              keyExtractor={(e) => e.id}
              renderItem={({ item }) => (
                <Pressable accessibilityRole="button" onPress={() => void irA(item.id)} style={{ minHeight: 52, justifyContent: "center", borderBottomWidth: 1, borderBottomColor: colors.line }}>
                  <Text style={{ color: colors.muted, fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase" }}>{rotuloCapitulo(item)}{vista !== "premium" && !item.es_adelanto ? " · con suscripción" : ""}</Text>
                  <Text style={{ color: item.id === actual ? colors.accent : colors.ink, fontFamily: LETRA, fontSize: 18 }}>{item.titulo}</Text>
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function BloqueApp({ bloque, tamano, colors, activo, marcado, subrayados, notas, episodioOible, alActivar, alAbrirEpisodio }: {
  bloque: BloqueLibro;
  tamano: number;
  colors: typeof dark;
  activo: boolean;
  marcado: boolean;
  subrayados: AnotacionesLibro["subrayados"];
  notas: AnotacionesLibro["notas"];
  episodioOible: string | undefined;
  alActivar: (pos: number | null, subrayado: string | null) => void;
  alAbrirEpisodio: () => void;
}) {
  const trozos = useMemo(() => trozosDeHtml(bloque.html), [bloque.html]);
  const pintados = useMemo(() => aplicarSubrayados(trozos, subrayados.map((s) => ({ id: s.id, inicio: s.inicio, fin: s.fin }))), [trozos, subrayados]);
  const base = { fontFamily: LETRA, fontSize: bloque.tipo === "pasaje" ? tamano * 0.95 : tamano, lineHeight: tamano * 1.75, color: bloque.tipo === "pasaje" ? colors.muted : colors.ink };
  let posicion = 0;
  const hijos: ReactNode[] = [];
  pintados.forEach((trozo, i) => {
    if (trozo.tipo === "br") {
      posicion += 1;
      hijos.push(<Text key={`br${i}`}>{"\n"}</Text>);
      return;
    }
    const sub = "subrayados" in trozo ? trozo.subrayados?.[0] ?? null : null;
    const estiloComun = { ...(sub ? { backgroundColor: MARCA } : {}), ...(("em" in trozo && trozo.em) || bloque.tipo === "pasaje" ? { fontStyle: "italic" as const } : {}), ...(trozo.tipo === "texto" && trozo.strong ? { fontWeight: "700" as const } : {}) };
    const inicio = posicion;
    posicion += trozo.texto.length;
    if (trozo.tipo === "ref") {
      const abre = episodioOible === trozo.episodio;
      hijos.push(
        <Text key={i} onPress={abre ? alAbrirEpisodio : () => alActivar(inicio, sub)} accessibilityRole={abre ? "link" : undefined} style={[estiloComun, { color: colors.accent, textDecorationLine: "underline" }]}>{trozo.texto}</Text>,
      );
      return;
    }
    // Cada frase es tocable y lleva su desplazamiento, para subrayar la frase tocada.
    for (const frase of partirEnFrases(trozo.texto)) {
      hijos.push(
        <Text key={`${i}-${frase.inicio}`} onPress={() => alActivar(inicio + frase.inicio, sub)} style={estiloComun}>{frase.texto}</Text>,
      );
    }
  });
  return (
    <View style={{ marginHorizontal: 22, marginTop: bloque.tipo === "subtitulo" ? 26 : 14, paddingLeft: 6, borderLeftWidth: marcado ? 3 : 0, borderLeftColor: colors.accent, backgroundColor: activo ? "rgba(201,169,110,0.1)" : "transparent" }}>
      <Text accessibilityRole={bloque.tipo === "subtitulo" ? "header" : undefined} style={[base, { textAlign: "left" }, bloque.tipo === "subtitulo" ? { fontWeight: "700" } : null]}>{hijos}</Text>
      {notas.map((nota) => (
        <View key={nota.id} style={{ marginTop: 6, paddingVertical: 8, paddingHorizontal: 12, borderLeftWidth: 2, borderLeftColor: colors.accent, backgroundColor: colors.card }}>
          <Text style={{ color: colors.muted, fontSize: 12 }}>{new Date(nota.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}</Text>
          <Text style={{ color: colors.ink, fontSize: 15, lineHeight: 21 }}>{nota.texto}</Text>
        </View>
      ))}
    </View>
  );
}
