import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { ScrollView, Text, View, type ScrollViewInstance } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fonts } from "../theme";
import { th, llenar } from "../textos-hoy";
import { tx } from "../textos";
import { CaminoActualCard, CaminoCard } from "../ui/CaminoCard";
import { Entrada } from "../ui/Entrada";
import { Icono } from "../ui/Icono";
import { ScreenHeader } from "../ui/ScreenHeader";
import { haptico, useTema } from "../ui/tema";
import { useCaminos, type CaminoVista } from "../ui/useCaminos";
import { useReproducir } from "../ui/useReproducir";

export default function Caminos() {
  const { c, lang, library } = useTema();
  const t = th(lang);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const caminos = useCaminos();
  const reproducirId = useReproducir();
  const scroll = useRef<ScrollViewInstance>(null);
  const [elegido, setElegido] = useState<string | null>(null);
  const actual = caminos.find((camino) => camino.activo) ?? caminos[0];
  const otros = caminos.filter((camino) => camino !== actual);

  const audioTexto = (camino: CaminoVista) =>
    camino.audio.estado === "todo" ? t.audioTodo : camino.audio.estado === "parte" ? llenar(t.audioParte, { n: camino.audio.conAudio }) : t.audioNada;
  const avanceTexto = (camino: CaminoVista, siempre: boolean) =>
    camino.progreso.hechos > 0 || siempre ? llenar(t.escuchados, { h: camino.progreso.hechos, t: camino.progreso.total }) : "";

  const elegir = (camino: CaminoVista) => {
    haptico();
    // Solo cambia el camino activo. El avance de cada episodio no se toca.
    library.updateSettings({ caminoActivo: camino.def.id });
    setElegido(camino.nombre);
    scroll.current?.scrollTo({ y: 0, animated: true });
  };

  const sig = actual?.siguiente ?? null;
  return (
    <ScrollView ref={scroll} style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ paddingBottom: 32 + insets.bottom }} showsVerticalScrollIndicator={false}>
      <ScreenHeader c={c} titulo={tx(lang).tabCaminos} />
      <View style={{ paddingHorizontal: 20, gap: 24, paddingTop: 4 }}>
        <Text style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 16, lineHeight: 23 }}>{t.caminosIntro}</Text>

        {elegido ? (
          <View accessibilityLiveRegion="polite" accessible accessibilityLabel={llenar(t.cambio, { nombre: elegido })} style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 20, backgroundColor: c.card, borderWidth: 1.5, borderColor: c.accent }}>
            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: c.accent, alignItems: "center", justifyContent: "center" }}>
              <Icono nombre="check" size={16} color={c.accentInk} trazo={2.4} />
            </View>
            <Text style={{ flex: 1, color: c.ink, fontFamily: fonts.medium, fontSize: 15, lineHeight: 21 }}>{llenar(t.cambio, { nombre: elegido })}</Text>
          </View>
        ) : null}

        {actual ? (
          <Entrada orden={0} style={{ gap: 12 }}>
            <Text accessibilityRole="header" style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 22 }}>{t.miCamino}</Text>
            <CaminoActualCard
              c={c}
              src={actual.src}
              nombre={actual.nombre}
              descripcion={actual.descripcion}
              duracion={actual.duracion}
              audio={audioTexto(actual)}
              avance={avanceTexto(actual, true)}
              fraccion={actual.progreso.fraccion}
              siguiente={sig && sig.reproducible ? { etiqueta: t.siguiente, titulo: sig.titulo, subtitulo: [sig.subtitulo, sig.duracion].filter(Boolean).join(" · ") } : undefined}
              nota={!sig ? t.caminoCompleto : !sig.reproducible ? `${t.siguiente}: ${sig.titulo}. ${t.siguienteSinAudio}` : undefined}
              etiquetaEscuchar={sig?.reproducible ? t.escuchar : undefined}
              onEscuchar={sig?.reproducible ? () => reproducirId(sig.id, { contexto: { tipo: "camino", id: actual.def.id } }) : undefined}
              etiquetaVolver={t.volverHoy}
              onVolver={() => {
                haptico();
                router.navigate("/");
              }}
            />
          </Entrada>
        ) : null}

        <View style={{ gap: 12 }}>
          <Text accessibilityRole="header" style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 22 }}>{t.elegirTitulo}</Text>
          {otros.map((camino, i) => (
            <Entrada key={camino.def.id} orden={i + 1}>
              <CaminoCard
                c={c}
                nombre={camino.nombre}
                descripcion={camino.descripcion}
                duracion={camino.duracion}
                audio={audioTexto(camino)}
                avance={avanceTexto(camino, false)}
                fraccion={camino.progreso.fraccion}
                etiquetaElegir={t.elegir}
                onElegir={() => elegir(camino)}
              />
            </Entrada>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
