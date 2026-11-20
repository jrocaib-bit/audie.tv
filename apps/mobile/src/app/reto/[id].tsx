import { localIsoDate, racha as calcularRacha } from "@audite/domain";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { tipoAcceso } from "../../acceso";
import { infoEpisodio } from "../../hoy";
import { diasParaEmpezar, indiceDeHoy, pinturasDeReto } from "../../reto-dias";
import { datosDeReto, modeloRetos, pasosDeReto, ventanaDeReto } from "../../temporadas";
import { tx } from "../../textos";
import { fonts } from "../../theme";
import { Boton } from "../../ui/Basicos";
import { CaminoDias, type NodoDia } from "../../ui/CaminoDias";
import { Carrusel } from "../../ui/Carrusel";
import { DiaDetalle, type DatosDia } from "../../ui/DiaDetalle";
import { Entrada } from "../../ui/Entrada";
import { Icono } from "../../ui/Icono";
import { ObraMarco } from "../../ui/ObraMarco";
import { PlacaMarca, monogramaDe } from "../../ui/PlacaMarca";
import { Pulsable } from "../../ui/Pulsable";
import { ChipEstado } from "../../ui/RetoCard";
import { Ring } from "../../ui/Ring";
import { hapticoExito, useTema } from "../../ui/tema";
import { useContextoCatalogo } from "../../ui/useHoy";
import { useReproducir } from "../../ui/useReproducir";
import { chipDeReto } from "../retos";

export default function RetoDetalle() {
  const { id: parametro } = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(parametro) ? parametro[0] ?? "" : parametro ?? "";
  const { c, lang, library } = useTema();
  const t = tx(lang);
  const insets = useSafeAreaInsets();
  const ventana = useWindowDimensions();
  const reproducirId = useReproducir();
  const base = useContextoCatalogo();
  const datos = datosDeReto(id);
  const hoyIso = localIsoDate(new Date());
  const m = useMemo(() => modeloRetos({ lang, hoyIso, progress: library.progress, rangos: library.catalog.rangos }), [hoyIso, lang, library.catalog.rangos, library.progress]);
  const tarjeta = m.temporadas.find((item) => item.id === id);
  const pasos = pasosDeReto(id);
  const grabados = useMemo(() => new Set(library.catalog.episodes.map((e) => e.id)), [library.catalog.episodes]);
  const pinturas = useMemo(() => (datos ? pinturasDeReto(datos) : []), [datos]);
  const ventanaReto = ventanaDeReto(id);
  const hoyPos = indiceDeHoy(ventanaReto.inicio, hoyIso, pasos.length);
  const hechosN = tarjeta?.hechos ?? 0;
  const primerPendiente = pasos.findIndex((p) => !(p.episodio && library.progress.episodes[p.episodio]?.completed));
  const [elegido, setElegido] = useState<number | null>(null);
  const seleccionado = Math.min(Math.max(0, elegido ?? hoyPos ?? (primerPendiente < 0 ? 0 : primerPendiente)), Math.max(0, pasos.length - 1));

  // Un pulso de éxito cuando un día pasa a completado (no al abrir la pantalla).
  const hechosPrevios = useRef(hechosN);
  useEffect(() => {
    if (hechosN > hechosPrevios.current) hapticoExito();
    hechosPrevios.current = hechosN;
  }, [hechosN]);

  if (!datos || !tarjeta || pasos.length === 0) return null;

  const racha = calcularRacha(library.progress.listenedOn, hoyIso);
  const completado = (episodio?: string) => Boolean(episodio && library.progress.episodes[episodio]?.completed);
  const jugable = (episodio?: string) => Boolean(episodio && grabados.has(episodio));
  const jugar = (i: number) => {
    const episodio = pasos[i]?.episodio;
    if (!episodio || !jugable(episodio)) return;
    reproducirId(episodio, { contexto: { tipo: "reto", id }, pos: i });
  };
  const titulo = datos.titulo[lang];
  const monograma = monogramaDe(titulo);
  const siguienteGrabado = tarjeta.siguiente && grabados.has(tarjeta.siguiente) ? tarjeta.siguiente : null;
  const faltan = tarjeta.estado === "empieza" ? diasParaEmpezar(ventanaReto.inicio, hoyIso) : 0;
  const cuentaAtras = faltan > 0 ? (faltan === 1 ? t.faltaUnDia : t.faltanDias.replace("{n}", String(faltan))) : null;

  const nodos: NodoDia[] = pasos.map((p, i) => ({
    dia: p.dia,
    src: pinturas[i] ?? "",
    hecho: completado(p.episodio),
    hoy: hoyPos === i,
    quieto: !jugable(p.episodio),
    etiqueta: `${t.dia} ${p.dia}. ${p.titulo[lang]}`,
  }));
  const paso = pasos[seleccionado]!;
  const detalle: DatosDia = {
    dia: paso.dia,
    titulo: paso.titulo[lang],
    minutos: paso.minutos,
    tipo: tipoAcceso(paso.episodio ?? "", jugable(paso.episodio)),
    diaLiturgico: paso.diaLiturgico,
    referencias: paso.referencias,
    nota: paso.nota,
    relacionados: (paso.relacionados ?? []).map((rel) => ({ id: rel, titulo: infoEpisodio(rel, base).titulo, disponible: grabados.has(rel) })),
  };
  const ancho = Math.min(ventana.width - 96, 340);
  const alto = Math.min(ancho, ventana.height * 0.36);
  const porcentaje = Math.round((hechosN / pasos.length) * 100);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ paddingBottom: 32 + insets.bottom, gap: 20 }} showsVerticalScrollIndicator={false}>
      <Entrada style={{ paddingHorizontal: 20, gap: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <ChipEstado c={c} {...chipDeReto(tarjeta, lang)} />
          {cuentaAtras ? <Text style={{ color: c.accent, fontFamily: fonts.medium, fontSize: 14, fontWeight: "700" }}>{cuentaAtras}</Text> : null}
        </View>
        <Text accessibilityRole="header" style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 34, lineHeight: 38 }}>{titulo}</Text>
        <Text style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 14 }}>{tarjeta.fechas}</Text>
      </Entrada>

      <Entrada orden={1}>
        <Carrusel
          n={pasos.length}
          indice={seleccionado}
          onCambia={setElegido}
          ancho={ancho}
          alto={alto}
          vista={ventana.width}
          render={(i, activo) => {
            const p = pasos[i]!;
            const puedo = jugable(p.episodio);
            return (
              <Pulsable
                onPress={activo ? (puedo ? () => jugar(i) : undefined) : () => setElegido(i)}
                disabled={activo && !puedo}
                label={activo ? `${t.dia} ${p.dia}. ${p.titulo[lang]}${puedo ? `. ${t.reproducir}` : `. ${t.proximamente}`}` : `${t.dia} ${p.dia}`}
                escala={0.98}
                style={{ width: ancho, height: alto, borderRadius: 24, overflow: "hidden", backgroundColor: "#0C0B09" }}
              >
                {pinturas[i] ? <ObraMarco src={pinturas[i]!} style={{ width: ancho, height: alto }} /> : <PlacaMarca monograma={monograma} size={88} style={{ width: ancho, height: alto }} />}
                {completado(p.episodio) ? (
                  <View style={{ position: "absolute", top: 12, right: 12, width: 30, height: 30, borderRadius: 15, backgroundColor: c.accent, alignItems: "center", justifyContent: "center" }}>
                    <Icono nombre="check" size={16} color={c.accentInk} trazo={3} />
                  </View>
                ) : null}
                {activo && puedo ? (
                  <View style={{ position: "absolute", right: 12, bottom: 12, width: 44, height: 44, borderRadius: 22, backgroundColor: c.accent, alignItems: "center", justifyContent: "center" }}>
                    <Icono nombre="play" size={20} color={c.accentInk} />
                  </View>
                ) : null}
              </Pulsable>
            );
          }}
        />
      </Entrada>

      <Entrada orden={2} style={{ paddingHorizontal: 20 }}>
        <DiaDetalle c={c} lang={lang} datos={detalle} etiquetaDia={t.dia} etiquetaProximamente={t.proximamente} onRelacionado={(rel) => reproducirId(rel, { contexto: { tipo: "libro", id: base.rangos.find((r) => r.id === rel)?.bookId ?? rel.split("-")[0] ?? "gn" } })} />
      </Entrada>

      <Entrada orden={3} style={{ marginHorizontal: 20, flexDirection: "row", alignItems: "center", gap: 14, padding: 14, borderRadius: 22, backgroundColor: c.card, borderWidth: 1, borderColor: c.line }}>
        <Ring fraccion={hechosN / pasos.length} size={52} trazo={6} color={c.accent} pista={c.line}>
          <Text style={{ color: c.ink, fontFamily: fonts.medium, fontSize: 12 }}>{porcentaje}%</Text>
        </Ring>
        <Text style={{ flex: 1, color: c.ink, fontFamily: fonts.serif, fontSize: 24 }}>{hechosN} {t.de} {pasos.length}</Text>
        <View accessible accessibilityLabel={`${racha} ${t.racha}`} style={{ flexDirection: "row", alignItems: "center", gap: 6, minHeight: 36, paddingHorizontal: 12, borderRadius: 18, backgroundColor: racha > 0 ? "rgba(224,196,138,0.14)" : "transparent", borderWidth: racha > 0 ? 0 : 1, borderColor: c.line }}>
          <Icono nombre="llama" size={16} color={racha > 0 ? c.accent : c.muted} />
          <Text style={{ color: racha > 0 ? c.accent : c.muted, fontFamily: fonts.medium, fontSize: 15, fontWeight: "700" }}>{racha}</Text>
        </View>
      </Entrada>

      <Entrada orden={4}>
        <CaminoDias c={c} nodos={nodos} seleccionado={seleccionado} onElegir={setElegido} vista={ventana.width} monograma={monograma} etiquetaHoy={t.hoy} etiqueta={t.caminoDias} />
      </Entrada>

      {siguienteGrabado ? (
        <Entrada orden={5} style={{ paddingHorizontal: 20 }}>
          <Boton
            c={c}
            texto={hechosN > 0 ? t.continuar : t.unirme}
            icono="play"
            onPress={() => {
              if (hechosN === 0) hapticoExito();
              const pos = Math.max(0, pasos.findIndex((p) => p.episodio === siguienteGrabado && !completado(p.episodio)));
              reproducirId(siguienteGrabado, { contexto: { tipo: "reto", id }, pos });
            }}
          />
        </Entrada>
      ) : null}
    </ScrollView>
  );
}
