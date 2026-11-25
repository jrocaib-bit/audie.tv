import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { estadoEnCurso } from "../hoy-empezados";
import { BLOQUES_HOY, PREFERENCIAS_INICIALES, alternarVisible, estaOculto, mover, ordenar, puedeMover, visibles, type BloqueHoy } from "../hoy-preferencias";
import { fonts } from "../theme";
import { tx } from "../textos";
import { th, llenar } from "../textos-hoy";
import { useHuecoInferior } from "../ui/barra-flotante";
import { Boton, BotonRedondo, SUPERFICIE } from "../ui/Basicos";
import { FilaEditable, TarjetaLibro, TarjetaReto, detalleLibro, detalleReto } from "../ui/HoyEnCurso";
import { Entrada } from "../ui/Entrada";
import { HeroCard } from "../ui/HeroCard";
import { Icono } from "../ui/Icono";
import { ObraMarco } from "../ui/ObraMarco";
import { ProgressBar } from "../ui/ProgressBar";
import { Pulsable } from "../ui/Pulsable";
import { ScreenHeader } from "../ui/ScreenHeader";
import { useTema } from "../ui/tema";
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
  const claves = enCurso.tarjetas.map((x) => x.clave);
  const porClave = new Map(enCurso.tarjetas.map((x) => [x.clave, x]));
  const tarjetasVisibles = visibles(claves, preferencias.tarjetas).flatMap((k) => porClave.get(k) ?? []);
  const estadoSeccion = estadoEnCurso(enCurso.tarjetas.length, tarjetasVisibles.length);

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
        <HeroCard c={c} kicker={`${t.miCamino} · ${m.camino.nombre}`} titulo={t.completoTitulo} aviso={t.completoCuerpo} etiquetaAccion={t.elegirOtro} tipoAccion="camino" onAccion={() => router.push("/escuchar/caminos")} />
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
        />
      )}
      <Pulsable onPress={() => router.push("/escuchar/caminos")} label={`${t.verCamino}. ${m.camino.nombre}`} escala={0.98} style={{ minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 6 }}>
        <Text numberOfLines={1} style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 14, flexShrink: 1 }}>{t.miCamino}: {m.camino.nombre}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingLeft: 12 }}>
          <Text style={{ color: c.accent, fontFamily: fonts.medium, fontSize: 14, fontWeight: "600" }}>{t.verCamino}</Text>
          <Icono nombre="chevron" size={14} color={c.accent} />
        </View>
      </Pulsable>
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
                <TarjetaLibro key={x.clave} c={c} t={t} libro={x} onPress={() => router.push(`/libros/${x.slug}/leer`)} />
              ) : (
                <TarjetaReto key={x.clave} c={c} t={t} reto={x} onPress={() => router.push(`/reto/${x.id}`)} />
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
              ? ordenar(claves, preferencias.tarjetas).map((k) => {
                  const x = porClave.get(k);
                  if (!x) return null;
                  const movT = puedeMover(claves, preferencias.tarjetas, k);
                  return (
                    <FilaEditable
                      key={k}
                      c={c}
                      t={t}
                      sangria
                      nombre={x.titulo}
                      nota={x.tipo === "libro" ? `${t.libroComentado} · ${detalleLibro(t, x)}` : detalleReto(t, x)}
                      oculto={estaOculto(preferencias.tarjetas, k)}
                      subir={movT.subir}
                      bajar={movT.bajar}
                      onAlternar={() => cambiar((p) => ({ ...p, tarjetas: alternarVisible(p.tarjetas, k) }))}
                      onSubir={() => cambiar((p) => ({ ...p, tarjetas: mover(claves, p.tarjetas, k, -1) }))}
                      onBajar={() => cambiar((p) => ({ ...p, tarjetas: mover(claves, p.tarjetas, k, 1) }))}
                    />
                  );
                })
              : null}
          </View>
        );
      })}
      <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
        <Boton c={c} secundario texto={t.restablecer} onPress={() => cambiar(() => PREFERENCIAS_INICIALES)} style={{ flex: 1 }} />
        <Boton c={c} texto={t.listo} onPress={() => setEditando(false)} style={{ flex: 1 }} />
      </View>
    </View>
  );

  const botonEditar = (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <Pulsable
        onPress={() => setEditando((e) => !e)}
        label={editando ? t.listo : t.editarHoy}
        haptica
        escala={0.94}
        style={{ minHeight: 44, minWidth: 44, paddingHorizontal: 16, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: editando ? c.accent : c.card }}
      >
        <Text style={{ color: editando ? c.accentInk : c.ink, fontFamily: fonts.medium, fontSize: 15, fontWeight: "600" }}>{editando ? t.listo : t.editar}</Text>
      </Pulsable>
      <BotonRedondo c={c} nombre="usuario" label="Ajustes" onPress={() => router.push("/ajustes")} />
    </View>
  );

  return (
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
  );
}
