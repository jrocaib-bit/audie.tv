import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { tipoAcceso } from "../acceso";
import { infoEpisodio } from "../hoy";
import { dark, fonts } from "../theme";
import { tx } from "../textos";
import { Entrada } from "../ui/Entrada";
import { Icono } from "../ui/Icono";
import { Insignia } from "../ui/Insignia";
import { ObraMarco } from "../ui/ObraMarco";
import { ProgressBar } from "../ui/ProgressBar";
import { Pulsable } from "../ui/Pulsable";
import { useTema } from "../ui/tema";
import { useCola } from "../ui/useCola";
import { useContextoCatalogo } from "../ui/useHoy";
import { useReproducir } from "../ui/useReproducir";

const c = dark;
const LOTE = 40;

/** «A continuación»: lo que viene en la cola, desde lo que suena. */
export default function ACola() {
  const { lang, library } = useTema();
  const t = tx(lang);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cola = useCola();
  const base = useContextoCatalogo();
  const reproducir = useReproducir();
  const [limite, setLimite] = useState(LOTE);
  const filas = useMemo(() => cola.ids.slice(cola.pos, cola.pos + limite).map((id, i) => ({ id, pos: cola.pos + i })), [cola.ids, cola.pos, limite]);

  return (
    <View style={{ flex: 1, backgroundColor: c.gallery }}>
      <FlatList
        data={filas}
        keyExtractor={(fila) => `${fila.pos}-${fila.id}`}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 24 }}
        initialNumToRender={12}
        windowSize={7}
        onEndReachedThreshold={0.6}
        onEndReached={() => setLimite((v) => (v < cola.ids.length - cola.pos ? v + LOTE : v))}
        ListHeaderComponent={
          <View style={{ gap: 12, paddingTop: 20, paddingBottom: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text accessibilityRole="header" style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 32, lineHeight: 36 }}>{t.aContinuacion}</Text>
              <Pulsable onPress={() => router.back()} label={t.cerrar} hitSlop={10} escala={0.9} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}>
                <Icono nombre="cerrar" size={22} color={c.muted} />
              </Pulsable>
            </View>
            <Text style={{ color: c.muted, fontFamily: fonts.medium, fontSize: 14 }}>{cola.largo}</Text>
            <ProgressBar fraccion={cola.info.fraccion} color={c.accent} pista="rgba(244,236,226,0.16)" alto={5} />
          </View>
        }
        renderItem={({ item, index }) => {
          const info = infoEpisodio(item.id, base);
          const actual = index === 0;
          const grabado = cola.grabado(item.id);
          const hecho = library.progress.episodes[item.id]?.completed === true;
          return (
            <Entrada orden={Math.min(index, 6)}>
              <Pulsable
                onPress={grabado ? () => { router.back(); reproducir(item.id, { pos: item.pos, abrir: false }); } : undefined}
                disabled={!grabado}
                label={info.titulo}
                escala={0.985}
                style={{ marginBottom: 8, padding: 10, borderRadius: 20, flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: actual ? "rgba(224,196,138,0.1)" : "rgba(244,236,226,0.05)", borderWidth: 1, borderColor: actual ? c.accent : "transparent", opacity: grabado ? 1 : 0.65 }}
              >
                <ObraMarco src={info.src} style={{ width: 60, height: 60, borderRadius: 12 }} desenfoque={12} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text numberOfLines={2} style={{ color: actual ? c.accent : c.ink, fontFamily: fonts.serif, fontSize: 19, lineHeight: 23 }}>{info.titulo}</Text>
                  <Text numberOfLines={1} style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 13 }}>{[info.capitulos, info.duracion].filter(Boolean).join(" · ")}</Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: 6 }}>
                  {actual ? <Icono nombre="ondas" size={20} color={c.accent} /> : hecho ? <Icono nombre="check" size={18} color={c.muted} /> : null}
                  <Insignia tipo={tipoAcceso(item.id, grabado)} c={c} lang={lang} />
                </View>
              </Pulsable>
            </Entrada>
          );
        }}
      />
    </View>
  );
}
