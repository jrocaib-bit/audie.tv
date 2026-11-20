import { useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fonts } from "../theme";
import { tx } from "../textos";
import { BotonRedondo } from "../ui/Basicos";
import { Entrada } from "../ui/Entrada";
import { GoalCard, RachaCard } from "../ui/GoalCard";
import { HeroCard } from "../ui/HeroCard";
import { Icono } from "../ui/Icono";
import { ObraMarco } from "../ui/ObraMarco";
import { ProgressBar } from "../ui/ProgressBar";
import { Pulsable } from "../ui/Pulsable";
import { ScreenHeader } from "../ui/ScreenHeader";
import { useTema } from "../ui/tema";
import { useModeloHoy } from "../ui/useHoy";
import type { TarjetaHoy } from "../hoy";

function Carril({ titulo, items, c, onPress, verTodo, onVerTodo }: { titulo: string; items: TarjetaHoy[]; c: ReturnType<typeof useTema>["c"]; onPress: (item: TarjetaHoy) => void; verTodo: string; onVerTodo: () => void }) {
  if (items.length === 0) return null;
  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text accessibilityRole="header" style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 20 }}>{titulo}</Text>
        <Pulsable onPress={onVerTodo} label={verTodo} hitSlop={12} escala={0.94} style={{ minHeight: 44, justifyContent: "center" }}>
          <Text style={{ color: c.accent, fontFamily: fonts.medium, fontSize: 14, fontWeight: "600" }}>{verTodo}</Text>
        </Pulsable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 20 }} style={{ marginHorizontal: -20 }}>
        {items.map((item) => (
          <Pulsable key={item.id} onPress={() => onPress(item)} label={item.titulo} style={{ width: 148, gap: 8 }}>
            <ObraMarco src={item.src} style={{ width: 148, height: 112, borderRadius: 20 }} />
            <Text numberOfLines={1} style={{ color: c.ink, fontFamily: fonts.medium, fontSize: 15 }}>{item.titulo}</Text>
          </Pulsable>
        ))}
      </ScrollView>
    </View>
  );
}

export default function Hoy() {
  const { c, lang, library } = useTema();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const t = tx(lang);
  const m = useModeloHoy();
  const hero = m.hero;

  const reproducir = () => {
    if (!hero?.reproducible) return;
    if (hero.actual && library.playing) {
      library.toggle();
      return;
    }
    if (hero.actual) library.toggle();
    else library.playEpisode(hero.id);
    router.push("/ahora");
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ paddingBottom: 32 + insets.bottom }} showsVerticalScrollIndicator={false}>
      <ScreenHeader
        c={c}
        kicker={m.saludo}
        titulo={t.hoy}
        derecha={<BotonRedondo c={c} nombre="usuario" label={t.perfil} onPress={() => router.push("/ajustes")} />}
      />
      <View style={{ paddingHorizontal: 20, gap: 20, paddingTop: 8 }}>
        {hero ? (
          <Entrada orden={0}>
            <HeroCard
              c={c}
              src={hero.src}
              kicker={hero.retomar ? t.continuar : t.hoy}
              titulo={hero.titulo}
              meta={[hero.libro && hero.capitulos ? hero.capitulos : hero.libro, hero.duracion].filter(Boolean).join(" · ")}
              fraccion={hero.fraccion}
              ratio={hero.ratio}
              jugando={library.playing && hero.actual}
              proximamente={hero.reproducible ? undefined : t.proximamente}
              etiquetaPlay={library.playing && hero.actual ? t.pausar : t.escuchar}
              onPlay={reproducir}
              onAbrir={() => { if (!hero.reproducible) return router.push("/camino"); if (!hero.actual) library.playEpisode(hero.id); router.push("/ahora"); }}
            />
          </Entrada>
        ) : null}

        <Entrada orden={1} style={{ flexDirection: "row", gap: 12 }}>
          <RachaCard c={c} etiqueta={t.rachaTitulo} racha={m.racha} dias={t.diasCorto} semana={m.semana} />
          <GoalCard c={c} nombre={m.camino.nombre} hechos={m.camino.hechos} total={m.camino.total} fraccion={m.camino.fraccion} de={t.de} onAbrir={() => router.push("/camino")} />
        </Entrada>

        {m.continuar ? (
          <Entrada orden={3}>
            <Pulsable onPress={() => { library.playEpisode(m.continuar!.id); router.push("/ahora"); }} label={m.continuar.titulo} style={{ borderRadius: 24, padding: 16, flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: c.card, borderWidth: 1, borderColor: c.line }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.accent, alignItems: "center", justifyContent: "center" }}>
                <Icono nombre="play" size={20} color={c.accentInk} />
              </View>
              <View style={{ flex: 1, gap: 8 }}>
                <Text numberOfLines={1} style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 20 }}>{m.continuar.titulo}</Text>
                <ProgressBar fraccion={m.continuar.fraccion} color={c.accent} pista={c.line} alto={4} />
              </View>
              <Text style={{ color: c.accent, fontFamily: fonts.medium, fontSize: 14, fontWeight: "600" }}>{t.continuar}</Text>
            </Pulsable>
          </Entrada>
        ) : null}

        <Entrada orden={4}>
          <Pulsable onPress={() => router.push("/reto-adviento")} label={m.adviento.titulo} style={{ borderRadius: 24, padding: 12, flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: c.card, borderWidth: 1, borderColor: c.line }}>
            <ObraMarco src={m.adviento.src} style={{ width: 88, height: 88, borderRadius: 16 }} />
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 24 }}>{m.adviento.titulo}</Text>
              <Text style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 14 }}>{m.adviento.hechos} {t.de} {m.adviento.total}</Text>
              <ProgressBar fraccion={m.adviento.fraccion} color={c.accent} pista={c.line} alto={5} />
            </View>
            <Icono nombre="chevron" size={18} color={c.muted} />
          </Pulsable>
        </Entrada>

        <Entrada orden={5} style={{ gap: 16, marginTop: 8 }}>
          <Carril c={c} titulo={t.libros} items={m.explorar.libros} verTodo={t.verTodo} onVerTodo={() => router.push("/biblioteca")} onPress={() => router.push("/biblioteca")} />
          <Carril c={c} titulo={t.caminos} items={m.explorar.caminos} verTodo={t.verTodo} onVerTodo={() => router.push("/camino")} onPress={() => router.push("/camino")} />
        </Entrada>
      </View>
    </ScrollView>
  );
}
