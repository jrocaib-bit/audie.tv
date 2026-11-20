import { localIsoDate } from "@audite/domain";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { tipoAcceso } from "../../acceso";
import { Insignia } from "../../ui/Insignia";
import { useReproducir } from "../../ui/useReproducir";
import { BucleCuadro } from "../../bucle-cuadro";
import { bucleDe, medidasHueco } from "../../bucles";
import { datosDeReto, modeloRetos, pasosDeReto } from "../../temporadas";
import { fonts } from "../../theme";
import { tx } from "../../textos";
import { Boton } from "../../ui/Basicos";
import { Entrada } from "../../ui/Entrada";
import { Icono } from "../../ui/Icono";
import { ObraMarco } from "../../ui/ObraMarco";
import { Pulsable } from "../../ui/Pulsable";
import { PlacaMarca, monogramaDe } from "../../ui/PlacaMarca";
import { infoEpisodio } from "../../hoy";
import { useContextoCatalogo } from "../../ui/useHoy";
import { ChipEstado } from "../../ui/RetoCard";
import { Ring } from "../../ui/Ring";
import { useTema } from "../../ui/tema";
import { chipDeReto } from "../retos";

export default function RetoDetalle() {
  const { id: parametro } = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(parametro) ? parametro[0] ?? "" : parametro ?? "";
  const { c, lang, library } = useTema();
  const t = tx(lang);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const ventana = useWindowDimensions();
  const reproducirId = useReproducir();
  const base = useContextoCatalogo();
  const [abierto, setAbierto] = useState<number | null>(null);
  const datos = datosDeReto(id);
  const hoyIso = localIsoDate(new Date());
  const m = useMemo(() => modeloRetos({ lang, hoyIso, progress: library.progress, rangos: library.catalog.rangos }), [hoyIso, lang, library.catalog.rangos, library.progress]);
  const tarjeta = m.temporadas.find((item) => item.id === id);
  const pasos = pasosDeReto(id);
  const grabados = useMemo(() => new Set(library.catalog.episodes.map((e) => e.id)), [library.catalog.episodes]);
  const hicks = id === "adviento-isaias" ? bucleDe("reto:adviento-isaias:o1") : null;
  const caja = hicks && hicks.poster ? medidasHueco(hicks.aspect, ventana.width - 40, ventana.height * 0.4) : null;
  if (!datos || !tarjeta) return null;

  const hechos = tarjeta.hechos;
  const porcentaje = pasos.length ? Math.round((hechos / pasos.length) * 100) : 0;
  const siguiente = pasos.find((p) => !(p.episodio && library.progress.episodes[p.episodio]?.completed));
  const jugar = (episodio: string, pos: number) => {
    reproducirId(episodio, { contexto: { tipo: "reto", id }, pos });
  };
  const siguienteGrabado = tarjeta.siguiente && grabados.has(tarjeta.siguiente) ? tarjeta.siguiente : null;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 + insets.bottom, gap: 20 }} showsVerticalScrollIndicator={false}>
      <Entrada style={{ gap: 12 }}>
        <ChipEstado c={c} {...chipDeReto(tarjeta, lang)} />
        <Text accessibilityRole="header" style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 34, lineHeight: 38 }}>{datos.titulo[lang]}</Text>
        <Text style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 14 }}>{tarjeta.fechas}</Text>
        {caja && hicks ? (
          <View style={{ alignSelf: "center", width: caja.width, height: caja.height, borderRadius: 24, overflow: "hidden" }}>
            <BucleCuadro bucle={hicks} poster={hicks.poster} alt={hicks.alt} />
          </View>
        ) : (
          tarjeta.sinObra ? <PlacaMarca monograma={monogramaDe(datos.titulo[lang])} size={88} style={{ height: 240, borderRadius: 24 }} /> : <ObraMarco src={tarjeta.src} style={{ height: 240, borderRadius: 24 }} />
        )}
      </Entrada>

      <Entrada orden={1} style={{ flexDirection: "row", alignItems: "center", gap: 20, padding: 20, borderRadius: 24, backgroundColor: c.card, borderWidth: 1, borderColor: c.line }}>
        <Ring fraccion={pasos.length ? hechos / pasos.length : 0} size={104} trazo={9} color={c.accent} pista={c.line}>
          <Text style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 28 }}>{porcentaje}%</Text>
        </Ring>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 30 }}>{hechos} {t.de} {pasos.length}</Text>
          {siguiente ? <Text numberOfLines={2} style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 15 }}>{t.dia} {siguiente.dia} · {siguiente.titulo[lang]}</Text> : null}
        </View>
      </Entrada>

      {siguienteGrabado ? <Boton c={c} texto={hechos > 0 ? t.continuar : t.unirme} icono="play" onPress={() => jugar(siguienteGrabado, Math.max(0, pasos.findIndex((p) => p.episodio === siguienteGrabado && !(library.progress.episodes[siguienteGrabado]?.completed))))} /> : null}

      <View style={{ gap: 8 }}>
        {pasos.map((paso, i) => {
          const grabado = Boolean(paso.episodio && grabados.has(paso.episodio));
          const hecho = Boolean(paso.episodio && library.progress.episodes[paso.episodio]?.completed);
          if (paso.profecia) {
            const expandido = abierto === i;
            return (
              <Entrada key={`${paso.dia}-${i}`} orden={Math.min(i, 6) + 2}>
                <View style={{ borderRadius: 20, backgroundColor: c.card, borderWidth: 1, borderColor: expandido ? c.accent : c.line, overflow: "hidden" }}>
                  <Pulsable onPress={() => setAbierto(expandido ? null : i)} label={`${t.dia} ${paso.dia}. ${paso.titulo[lang]}. ${paso.profecia} → ${paso.cumplimiento}`} selected={expandido} escala={0.99} style={{ minHeight: 72, paddingHorizontal: 14, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 14, opacity: grabado ? 1 : 0.85 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: c.line }}>
                      <Text style={{ color: c.ink, fontFamily: fonts.medium, fontSize: 15 }}>{paso.dia}</Text>
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text numberOfLines={2} style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 20, lineHeight: 24 }}>{paso.titulo[lang]}</Text>
                      <Text numberOfLines={1} style={{ color: c.accent, fontFamily: fonts.medium, fontSize: 13 }}>{paso.profecia} → {paso.cumplimiento}</Text>
                    </View>
                    <Insignia tipo={tipoAcceso(paso.episodio ?? "", grabado)} c={c} lang={lang} />
                  </Pulsable>
                  {expandido ? (
                    <View style={{ paddingHorizontal: 14, paddingBottom: 14, gap: 12 }}>
                      {paso.nota ? <Text style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 14, lineHeight: 20 }}>{paso.nota}</Text> : null}
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                        {(paso.relacionados ?? []).map((rel) => {
                          const info = infoEpisodio(rel, base);
                          const disponible = grabados.has(rel);
                          const libro = base.rangos.find((r) => r.id === rel)?.bookId ?? rel.split("-")[0] ?? "gn";
                          return (
                            <Pulsable key={rel} onPress={disponible ? () => reproducirId(rel, { contexto: { tipo: "libro", id: libro } }) : undefined} disabled={!disponible} label={`${info.titulo}${disponible ? "" : `. ${t.proximamente}`}`} escala={0.96} style={{ minHeight: 44, paddingHorizontal: 14, borderRadius: 22, flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: c.line, backgroundColor: "rgba(244,236,226,0.05)", opacity: disponible ? 1 : 0.6 }}>
                              {disponible ? <Icono nombre="play" size={14} color={c.accent} /> : null}
                              <Text numberOfLines={1} style={{ color: c.ink, fontFamily: fonts.medium, fontSize: 14, maxWidth: 200 }}>{info.titulo}</Text>
                              {disponible ? null : <Text style={{ color: c.muted, fontFamily: fonts.medium, fontSize: 11 }}>{t.proximamente}</Text>}
                            </Pulsable>
                          );
                        })}
                      </View>
                    </View>
                  ) : null}
                </View>
              </Entrada>
            );
          }
          return (
            <Entrada key={`${paso.dia}-${i}`} orden={Math.min(i, 6) + 2}>
              <Pulsable onPress={grabado && paso.episodio ? () => jugar(paso.episodio!, i) : undefined} disabled={!grabado} label={`${t.dia} ${paso.dia}. ${paso.titulo[lang]}`} escala={0.985} style={{ minHeight: 64, paddingHorizontal: 14, borderRadius: 20, flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: c.card, borderWidth: 1, borderColor: c.line, opacity: grabado ? 1 : 0.7 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: hecho ? c.accent : "transparent", borderWidth: hecho ? 0 : 1, borderColor: c.line }}>
                  {hecho ? <Icono nombre="check" size={18} color={c.accentInk} trazo={2.4} /> : <Text style={{ color: c.ink, fontFamily: fonts.medium, fontSize: 15 }}>{paso.dia}</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={2} style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 20, lineHeight: 24 }}>{paso.titulo[lang]}</Text>
                  {grabado && paso.minutos ? <Text style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 13 }}>{paso.minutos} min</Text> : null}
                </View>
                <Insignia tipo={tipoAcceso(paso.episodio ?? "", grabado)} c={c} lang={lang} />
              </Pulsable>
            </Entrada>
          );
        })}
      </View>
    </ScrollView>
  );
}
