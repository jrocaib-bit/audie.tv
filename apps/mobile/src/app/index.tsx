import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { estadoEnCurso, huellaDe, repartirEnCurso, type TarjetaEnCurso } from "../hoy-empezados";
import { opcionesMenu, type OpcionMenu } from "../hoy-menu";
import { BLOQUES_HOY, PREFERENCIAS_INICIALES, alternarVisible, desfijar, estaFijado, estaOculto, fijar, mover, moverFijado, ordenar, puedeMover, quitar, visibles, volverAMostrar, type BloqueHoy, type PreferenciasHoy } from "../hoy-preferencias";
import { fonts } from "../theme";
import { tx } from "../textos";
import { th, llenar } from "../textos-hoy";
import { useHuecoInferior } from "../ui/barra-flotante";
import { Boton, BotonRedondo, SUPERFICIE } from "../ui/Basicos";
import { AvisoDeshacer, FilaEditable, FilaQuitada, HojaMenu, TarjetaLibro, TarjetaReto, detalleLibro, detalleReto, type MenuHoy } from "../ui/HoyEnCurso";
import { Entrada } from "../ui/Entrada";
import { HeroCard } from "../ui/HeroCard";
import { Icono } from "../ui/Icono";
import { ObraMarco } from "../ui/ObraMarco";
import { PlacaMarca, monogramaDe } from "../ui/PlacaMarca";
import { PortadaLibro } from "../libros/portada";
import { ProgressBar } from "../ui/ProgressBar";
import { Pulsable } from "../ui/Pulsable";
import { ScreenHeader } from "../ui/ScreenHeader";
import { hapticoMenu, useTema } from "../ui/tema";
import { useEnCurso } from "../ui/useEnCurso";
import { useModeloHoy } from "../ui/useHoy";
import { usePreferenciasHoy } from "../ui/usePreferenciasHoy";
import { useReproducir } from "../ui/useReproducir";

export default function Hoy() {
  const { c, lang, library } = useTema();
  const router = useRouter();
  const hueco = useHuecoInferior();
  const t = th(lang);
  const hoyTitulo = tx(lang).hoy;
  const m = useModeloHoy();
  const reproducirId = useReproducir();
  const hero = m.hero;
  const caminoId = library.settings.caminoActivo || "biblia";
  const enCurso = useEnCurso();
  const { preferencias, cambiar } = usePreferenciasHoy();
  const [editando, setEditando] = useState(false);
  /** Menú contextual abierto: el de una tarjeta de «En curso» o el del episodio de hoy. */
  const [menu, setMenu] = useState<{ tipo: "tarjeta"; tarjeta: TarjetaEnCurso } | { tipo: "episodio" } | null>(null);
  /** Aviso breve tras quitar o fijar, con las preferencias de antes para deshacer. */
  const [aviso, setAviso] = useState<{ texto: string; previas?: PreferenciasHoy; n: number } | null>(null);
  useEffect(() => {
    if (!aviso) return;
    const reloj = setTimeout(() => setAviso((a) => (a?.n === aviso.n ? null : a)), 5000);
    return () => clearTimeout(reloj);
  }, [aviso]);
  const { visibles: tarjetasVisibles, quitadas } = repartirEnCurso(enCurso.tarjetas, preferencias);
  const clavesVisibles = tarjetasVisibles.map((x) => x.clave);
  const clavesFijadas = clavesVisibles.filter((k) => estaFijado(preferencias, k));
  const clavesSueltas = clavesVisibles.filter((k) => !estaFijado(preferencias, k));
  const estadoSeccion = estadoEnCurso(enCurso.tarjetas.length, tarjetasVisibles.length);
  const avisar = (texto: string, previas?: PreferenciasHoy) => setAviso((a) => ({ texto, previas, n: (a?.n ?? 0) + 1 }));
  /** Quita la tarjeta de Hoy con la huella de su avance actual. Si estaba fijada, la desfija. El progreso no se toca. */
  const quitarDeHoy = (x: TarjetaEnCurso) => cambiar((p) => quitar(p, x.clave, huellaDe(x), new Date().toISOString()));
  const notaTarjeta = (x: TarjetaEnCurso) => (x.tipo === "libro" ? `${t.libroComentado} · ${detalleLibro(t, x)}` : detalleReto(t, x));
  const abrirMenu = (siguiente: NonNullable<typeof menu>, larga: boolean) => {
    if (larga) hapticoMenu();
    setMenu(siguiente);
  };

  const accionHero = () => {
    if (m.estado !== "listo" || !hero) return router.push("/escuchar/caminos");
    if (hero.actual && library.playing) return library.toggle();
    reproducirId(hero.id, { contexto: { tipo: "camino", id: caminoId } });
  };

  const encabezado = (texto: string, accion?: { etiqueta: string; onPress: () => void }) => (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 44 }}>
      <Text accessibilityRole="header" style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 22, flexShrink: 1 }}>{texto}</Text>
      {accion ? (
        <Pulsable onPress={accion.onPress} label={accion.etiqueta} hitSlop={8} escala={0.94} style={{ minHeight: 44, justifyContent: "center", paddingLeft: 12 }}>
          <Text style={{ color: c.accent, fontFamily: fonts.medium, fontSize: 15, fontWeight: "600" }}>{accion.etiqueta}</Text>
        </Pulsable>
      ) : null}
    </View>
  );

  const bloques: Record<BloqueHoy, React.ReactNode> = {
    camino: (
      <View style={{ gap: 4 }}>
      {m.estado === "completado" || !hero ? (
        <HeroCard c={c} kicker={`${t.miCamino} · ${m.camino.nombre}`} titulo={t.completoTitulo} aviso={t.completoCuerpo} etiquetaAccion={t.elegirOtro} tipoAccion="camino" onAccion={() => router.push("/escuchar/caminos")} onMantener={() => abrirMenu({ tipo: "episodio" }, true)} />
      ) : (
        <HeroCard
          c={c}
          src={hero.src}
          ratio={hero.ratio}
          kicker={t.kickerHoy}
          titulo={hero.titulo}
          subtitulo={[hero.subtitulo, m.estado === "listo" ? hero.duracion : ""].filter(Boolean).join(" · ")}
          aviso={m.estado === "sin-audio" ? `${t.sinAudioTitulo}. ${t.sinAudioCuerpo}` : undefined}
          dia={llenar(t.dia, { n: hero.dia, total: hero.total })}
          fraccionCamino={m.camino.fraccion}
          jugando={library.playing && hero.actual}
          etiquetaAccion={m.estado === "sin-audio" ? t.elegirOtro : library.playing && hero.actual ? t.pausar : hero.retomar ? t.seguir : t.escuchar}
          tipoAccion={m.estado === "listo" ? "play" : "camino"}
          onAccion={accionHero}
          onMantener={() => abrirMenu({ tipo: "episodio" }, true)}
        />
      )}
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Pulsable onPress={() => router.push("/escuchar/caminos")} label={`${t.verCamino}. ${m.camino.nombre}`} escala={0.98} style={{ flex: 1, minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 6 }}>
          <Text numberOfLines={1} style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 14, flexShrink: 1 }}>{t.miCamino}: {m.camino.nombre}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingLeft: 12 }}>
            <Text style={{ color: c.accent, fontFamily: fonts.medium, fontSize: 14, fontWeight: "600" }}>{t.verCamino}</Text>
            <Icono nombre="chevron" size={14} color={c.accent} />
          </View>
        </Pulsable>
        <Pulsable onPress={() => abrirMenu({ tipo: "episodio" }, false)} label={t.opcionesEpisodio} escala={0.9} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}>
          <Icono nombre="mas" size={20} color={c.muted} />
        </Pulsable>
      </View>
      </View>
    ),
    "en-curso": (
      <View style={{ gap: 10 }}>
        <View>
          {encabezado(t.enCurso, { etiqueta: t.verRetos, onPress: () => router.push("/retos") })}
          <Text style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 14, marginTop: -4 }}>{t.enCursoNota}</Text>
        </View>
        {estadoSeccion === "lista"
          ? tarjetasVisibles.map((x) =>
              x.tipo === "libro" ? (
                <TarjetaLibro key={x.clave} c={c} t={t} libro={x} fijado={estaFijado(preferencias, x.clave)} onPress={() => router.push(`/libros/${x.slug}/leer`)} onOpciones={() => abrirMenu({ tipo: "tarjeta", tarjeta: x }, true)} />
              ) : (
                <TarjetaReto key={x.clave} c={c} t={t} reto={x} fijado={estaFijado(preferencias, x.clave)} onPress={() => router.push(`/reto/${x.id}`)} onOpciones={() => abrirMenu({ tipo: "tarjeta", tarjeta: x }, true)} />
              ),
            )
          : enCurso.listo ? (
              <View style={{ borderRadius: SUPERFICIE.radioFila, padding: 18, gap: 12, backgroundColor: c.card }}>
                {estadoSeccion === "vacio" ? (
                  <>
                    <Text style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 20 }}>{t.vacioTitulo}</Text>
                    <Text style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 14, lineHeight: 20 }}>{t.vacioCuerpo}</Text>
                    <View style={{ flexDirection: "row", gap: 10 }}>
                      <Boton c={c} secundario texto={t.verLibros} onPress={() => router.push("/sala/libros")} style={{ flex: 1, minHeight: 48, paddingHorizontal: 12 }} />
                      <Boton c={c} secundario texto={t.verRetos} onPress={() => router.push("/retos")} style={{ flex: 1, minHeight: 48, paddingHorizontal: 12 }} />
                    </View>
                  </>
                ) : (
                  <>
                    <Text style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 14, lineHeight: 20 }}>{t.ocultoCuerpo}</Text>
                    <Boton c={c} secundario texto={t.editarHoy} onPress={() => setEditando(true)} style={{ minHeight: 48 }} />
                  </>
                )}
              </View>
            ) : null}
      </View>
    ),
    continuar: m.continuar ? (
      <View style={{ gap: 4 }}>
      {encabezado(t.continuarTitulo)}
      <Pulsable
        onPress={() => reproducirId(m.continuar!.id)}
        label={`${t.seguir}. ${m.continuar.titulo}`}
        style={{ borderRadius: SUPERFICIE.radioFila, padding: 12, flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: c.card }}
      >
        <ObraMarco src={m.continuar.src} style={{ width: 64, height: 64, borderRadius: 16 }} />
        <View style={{ flex: 1, gap: 6 }}>
          <View>
            <Text numberOfLines={1} style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 19 }}>{m.continuar.titulo}</Text>
            <Text numberOfLines={1} style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 13 }}>{m.continuar.subtitulo}</Text>
          </View>
          <ProgressBar fraccion={m.continuar.fraccion} color={c.accent} pista={c.line} alto={4} />
        </View>
        <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: c.accent, alignItems: "center", justifyContent: "center" }}>
          <Icono nombre="play" size={20} color={c.accentInk} />
        </View>
      </Pulsable>
      </View>
    ) : null,
    historias: m.historias.length > 0 ? (
      <View style={{ gap: 4 }}>
      {encabezado(t.historias, { etiqueta: t.verTodas, onPress: () => router.push("/escuchar") })}
      <Text style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 14, marginTop: -6, marginBottom: 8 }}>{t.historiasNota}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingHorizontal: 20 }} style={{ marginHorizontal: -20 }}>
        {m.historias.map((h) => (
          <Pulsable key={h.id} onPress={() => reproducirId(h.id, { contexto: { tipo: "libro", id: h.id.split("-")[0] ?? "" } })} label={`${h.titulo}. ${h.subtitulo}`} style={{ width: 156, gap: 8 }}>
            <ObraMarco src={h.src} style={{ width: 156, height: 118, borderRadius: SUPERFICIE.radioFila }} />
            <View style={{ gap: 2 }}>
              <Text numberOfLines={2} style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 17, lineHeight: 21 }}>{h.titulo}</Text>
              <Text numberOfLines={1} style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 13 }}>{h.subtitulo}</Text>
            </View>
          </Pulsable>
        ))}
      </ScrollView>
      </View>
    ) : null,
  };

  const nombreBloque: Record<BloqueHoy, string> = { camino: t.bloqueCamino, "en-curso": t.enCurso, continuar: t.bloqueContinuar, historias: t.historias };
  const notaBloque: Partial<Record<BloqueHoy, string>> = { camino: `${t.miCamino}: ${m.camino.nombre}`, "en-curso": t.notaEnCurso, continuar: m.continuar ? m.continuar.titulo : t.notaContinuar };
  const bloquesVisibles = visibles(BLOQUES_HOY, preferencias.bloques);
  const pintados = bloquesVisibles.filter((b) => bloques[b] !== null);

  const editor = (
    <View style={{ gap: 10 }}>
      <Text style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 14, lineHeight: 20, marginBottom: 4 }}>{t.editarAyuda}</Text>
      {ordenar(BLOQUES_HOY, preferencias.bloques).map((b) => {
        const mov = puedeMover(BLOQUES_HOY, preferencias.bloques, b);
        return (
          <View key={b} style={{ gap: 2 }}>
            <FilaEditable
              c={c}
              t={t}
              nombre={nombreBloque[b]}
              nota={notaBloque[b]}
              oculto={estaOculto(preferencias.bloques, b)}
              subir={mov.subir}
              bajar={mov.bajar}
              onAlternar={() => cambiar((p) => ({ ...p, bloques: alternarVisible(p.bloques, b) }))}
              onSubir={() => cambiar((p) => ({ ...p, bloques: mover(BLOQUES_HOY, p.bloques, b, -1) }))}
              onBajar={() => cambiar((p) => ({ ...p, bloques: mover(BLOQUES_HOY, p.bloques, b, 1) }))}
            />
            {b === "en-curso"
              ? tarjetasVisibles.map((x) => {
                  const k = x.clave;
                  // Lo fijado se ordena entre lo fijado y el resto entre el resto: lo fijado va siempre primero.
                  const fijado = estaFijado(preferencias, k);
                  const grupo = fijado ? clavesFijadas : clavesSueltas;
                  const i = grupo.indexOf(k);
                  const moverT = (delta: -1 | 1) =>
                    cambiar((p) => (fijado ? moverFijado(clavesFijadas, p, k, delta) : { ...p, tarjetas: mover(clavesSueltas, p.tarjetas, k, delta) }));
                  return (
                    <FilaEditable
                      key={k}
                      c={c}
                      t={t}
                      sangria
                      fijado={fijado}
                      nombre={x.titulo}
                      nota={fijado ? `${t.fijado} · ${notaTarjeta(x)}` : notaTarjeta(x)}
                      subir={i > 0}
                      bajar={i >= 0 && i < grupo.length - 1}
                      onQuitar={() => quitarDeHoy(x)}
                      onSubir={() => moverT(-1)}
                      onBajar={() => moverT(1)}
                    />
                  );
                })
              : null}
            {b === "en-curso" && quitadas.length > 0 ? (
              <View style={{ marginTop: 6 }}>
                <Text accessibilityRole="header" style={{ color: c.muted, fontFamily: fonts.medium, fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, paddingLeft: 28, paddingTop: 6 }}>{t.quitadoTitulo}</Text>
                {quitadas.map((x) => (
                  <FilaQuitada key={x.clave} c={c} t={t} nombre={x.titulo} nota={`${notaTarjeta(x)}. ${t.quitadoNota}`} onMostrar={() => cambiar((p) => volverAMostrar(p, x.clave))} />
                ))}
              </View>
            ) : null}
          </View>
        );
      })}
      <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
        <Boton c={c} secundario texto={t.restablecer} onPress={() => cambiar(() => PREFERENCIAS_INICIALES)} style={{ flex: 1 }} />
        <Boton c={c} texto={t.listo} onPress={() => setEditando(false)} style={{ flex: 1 }} />
      </View>
    </View>
  );

  /** Arriba a la derecha, como en iOS: los deslizadores abren Editar Hoy y en edición se cambian por «Listo». */
  const botonEditar = (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      {editando ? (
        <Pulsable
          onPress={() => setEditando(false)}
          label={t.listo}
          haptica
          escala={0.94}
          style={{ minHeight: 44, minWidth: 44, paddingHorizontal: 18, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: c.accent }}
        >
          <Text style={{ color: c.accentInk, fontFamily: fonts.medium, fontSize: 15, fontWeight: "700" }}>{t.listo}</Text>
        </Pulsable>
      ) : (
        <BotonRedondo c={c} nombre="deslizadores" label={t.editarHoy} onPress={() => setEditando(true)} />
      )}
      <BotonRedondo c={c} nombre="usuario" label="Ajustes" onPress={() => router.push("/ajustes")} />
    </View>
  );

  const tarjetaMenu = menu?.tipo === "tarjeta" ? menu.tarjeta : null;
  const datosMenu: MenuHoy | null = !menu
    ? null
    : tarjetaMenu
      ? {
          titulo: tarjetaMenu.titulo,
          detalle: tarjetaMenu.tipo === "libro" ? `${t.libroComentado} · ${detalleLibro(t, tarjetaMenu)}` : detalleReto(t, tarjetaMenu),
          imagen:
            tarjetaMenu.tipo === "libro" ? (
              tarjetaMenu.volumen ? <PortadaLibro volumen={tarjetaMenu.volumen} titulo={tarjetaMenu.titulo} ancho={38} /> : <Icono nombre="libro" size={28} color={c.accent} />
            ) : tarjetaMenu.sinObra || !tarjetaMenu.src ? (
              <PlacaMarca monograma={monogramaDe(tarjetaMenu.titulo)} size={52} style={{ width: 52, height: 52, borderRadius: 12 }} />
            ) : (
              <ObraMarco src={tarjetaMenu.src} style={{ width: 52, height: 52, borderRadius: 12 }} />
            ),
          opciones: opcionesMenu({ tipo: tarjetaMenu.tipo, fijado: estaFijado(preferencias, tarjetaMenu.clave) }),
          nota: t.quitarCuerpo,
        }
      : {
          titulo: hero && m.estado !== "completado" ? hero.titulo : t.completoTitulo,
          detalle: hero && m.estado !== "completado" ? `${t.bloqueCamino} · ${llenar(t.dia, { n: hero.dia, total: hero.total })}` : `${t.miCamino}: ${m.camino.nombre}`,
          imagen: hero?.src && m.estado !== "completado" ? <ObraMarco src={hero.src} style={{ width: 52, height: 52, borderRadius: 12 }} /> : undefined,
          opciones: opcionesMenu({ tipo: "episodio" }),
          nota: t.quitarEpisodioCuerpo,
        };

  const elegir = (opcion: OpcionMenu) => {
    const x = tarjetaMenu;
    setMenu(null);
    const previas = preferencias;
    switch (opcion) {
      case "fijar":
        if (!x) return;
        cambiar((p) => fijar(p, x.clave));
        return avisar(llenar(t.fijadoArriba, { nombre: x.titulo }), previas);
      case "desfijar":
        if (x) cambiar((p) => desfijar(p, x.clave));
        return;
      case "ir-libro":
        if (x?.tipo === "libro") router.push(`/libros/${x.slug}/leer`);
        return;
      case "ir-reto":
        if (x?.tipo === "reto") router.push(`/reto/${x.id}`);
        return;
      case "ver-camino":
        return router.push("/escuchar/caminos");
      case "editar-hoy":
        return setEditando(true);
      case "quitar":
        if (x) {
          quitarDeHoy(x);
          return avisar(llenar(t.saleDeHoy, { nombre: x.titulo }), previas);
        }
        cambiar((p) => (estaOculto(p.bloques, "camino") ? p : { ...p, bloques: alternarVisible(p.bloques, "camino") }));
        return avisar(llenar(t.saleDeHoy, { nombre: t.bloqueCamino }), previas);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ paddingBottom: 32 + hueco }} showsVerticalScrollIndicator={false}>
        <ScreenHeader c={c} kicker={editando ? t.editarHoy : m.saludo} titulo={hoyTitulo} derecha={botonEditar} />
        <View style={{ paddingHorizontal: 20, gap: 28, paddingTop: 8 }}>
          {editando ? (
            editor
          ) : pintados.length > 0 ? (
            pintados.map((b, i) => (
              <Entrada key={b} orden={i}>
                {bloques[b]}
              </Entrada>
            ))
          ) : (
            <View style={{ borderRadius: SUPERFICIE.radioFila, padding: 18, gap: 12, backgroundColor: c.card }}>
              <Text style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 14, lineHeight: 20 }}>{t.todoOculto}</Text>
              <Boton c={c} secundario texto={t.editarHoy} onPress={() => setEditando(true)} style={{ minHeight: 48 }} />
            </View>
          )}
        </View>
      </ScrollView>
      {aviso ? (
        <AvisoDeshacer
          c={c}
          t={t}
          texto={aviso.texto}
          abajo={hueco + 12}
          onDeshacer={
            aviso.previas
              ? () => {
                  const previas = aviso.previas!;
                  cambiar(() => previas);
                  setAviso(null);
                }
              : undefined
          }
        />
      ) : null}
      <HojaMenu c={c} t={t} menu={datosMenu} onElegir={elegir} onCerrar={() => setMenu(null)} />
    </View>
  );
}
