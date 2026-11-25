import { useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { fonts } from "../theme";
import { diasParaEmpezar } from "../reto-dias";
import { ventanaDeReto } from "../temporadas";
import { tx } from "../textos";
import { th, llenar } from "../textos-hoy";
import { localIsoDate } from "@audite/domain";
import { useHuecoInferior } from "../ui/barra-flotante";
import { SUPERFICIE } from "../ui/Basicos";
import { Entrada } from "../ui/Entrada";
import { HeroCard } from "../ui/HeroCard";
import { Icono } from "../ui/Icono";
import { ObraMarco } from "../ui/ObraMarco";
import { ProgressBar } from "../ui/ProgressBar";
import { Pulsable } from "../ui/Pulsable";
import { ScreenHeader } from "../ui/ScreenHeader";
import { useTema } from "../ui/tema";
import { useModeloHoy } from "../ui/useHoy";
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
  const faltan = diasParaEmpezar(ventanaDeReto("adviento-isaias").inicio, localIsoDate(new Date()));

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

  const retoTexto =
    m.adviento.fase === "proximo"
      ? faltan === 1 ? t.retoEmpiezaUno : llenar(t.retoEmpieza, { n: faltan })
      : llenar(t.retoDias, { h: m.adviento.hechos, t: m.adviento.total });
  const retoTitulo = m.adviento.fase === "proximo" ? t.retoProximo : m.adviento.fase === "activo" ? t.retoActivo : t.retoTerminado;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ paddingBottom: 32 + hueco }} showsVerticalScrollIndicator={false}>
      <ScreenHeader c={c} kicker={m.saludo} titulo={hoyTitulo} />
      <View style={{ paddingHorizontal: 20, gap: 28, paddingTop: 8 }}>
        <Entrada orden={0} style={{ gap: 4 }}>
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
        </Entrada>

        {m.continuar ? (
          <Entrada orden={1} style={{ gap: 4 }}>
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
          </Entrada>
        ) : null}

        <Entrada orden={2} style={{ gap: 4 }}>
          {encabezado(retoTitulo, { etiqueta: t.todosRetos, onPress: () => router.push("/retos") })}
          <Pulsable onPress={() => router.push("/reto/adviento-isaias")} label={`${m.adviento.titulo}. ${retoTexto}`} style={{ borderRadius: SUPERFICIE.radioFila, padding: 12, flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: c.card, minHeight: 88 }}>
            <ObraMarco src={m.adviento.src} style={{ width: 64, height: 64, borderRadius: 16 }} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text numberOfLines={1} style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 20 }}>{m.adviento.titulo}</Text>
              <Text style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 13 }}>{retoTexto}</Text>
              {m.adviento.fase === "activo" ? <ProgressBar fraccion={m.adviento.fraccion} color={c.accent} pista={c.line} alto={4} /> : null}
            </View>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: SUPERFICIE.suave, alignItems: "center", justifyContent: "center" }}>
              <Icono nombre="chevron" size={16} color={c.ink} />
            </View>
          </Pulsable>
        </Entrada>

        {m.historias.length > 0 ? (
          <Entrada orden={3} style={{ gap: 4 }}>
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
          </Entrada>
        ) : null}
      </View>
    </ScrollView>
  );
}
