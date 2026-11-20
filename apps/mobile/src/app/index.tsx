import { useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fonts } from "../theme";
import { tx } from "../textos";
import { Seccion } from "../ui/Basicos";
import { BotonRedondo } from "../ui/Basicos";
import { Entrada } from "../ui/Entrada";
import { GoalCard } from "../ui/GoalCard";
import { HeroCard } from "../ui/HeroCard";
import { Icono } from "../ui/Icono";
import { ObraMarco } from "../ui/ObraMarco";
import { ProgressBar } from "../ui/ProgressBar";
import { Pulsable } from "../ui/Pulsable";
import { ScreenHeader } from "../ui/ScreenHeader";
import { useTema } from "../ui/tema";
import { useModeloHoy } from "../ui/useHoy";
import type { TarjetaHoy } from "../hoy";

function Carril({ titulo, items, c, onPress }: { titulo: string; items: TarjetaHoy[]; c: ReturnType<typeof useTema>["c"]; onPress: (item: TarjetaHoy) => void }) {
  if (items.length === 0) return null;
  return (
    <View style={{ gap: 12 }}>
      <Text style={{ color: c.muted, fontFamily: fonts.medium, fontSize: 14 }}>{titulo}</Text>
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
    if (!library.playing) library.toggle();
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
              jugando={library.playing && hero.reproducible}
              proximamente={hero.reproducible ? undefined : t.proximamente}
              etiquetaPlay={library.playing && hero.reproducible ? t.pausar : t.escuchar}
              onPlay={reproducir}
              onAbrir={() => (hero.reproducible ? router.push("/ahora") : router.push("/camino"))}
            />
          </Entrada>
        ) : null}

        <Entrada orden={1}>
          <View accessible accessibilityLabel={`${m.racha} ${t.racha}`} style={{ borderRadius: 24, padding: 20, gap: 16, backgroundColor: c.card, borderWidth: 1, borderColor: c.line }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Icono nombre="llama" size={28} color={m.racha > 0 ? c.accent : c.muted} />
              <Text style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 44, lineHeight: 48 }}>{m.racha}</Text>
              <Text style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 15, flex: 1 }}>{t.racha}</Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              {m.semana.map((d) => (
                <View key={d.iso} style={{ alignItems: "center", gap: 8 }}>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: d.hecho ? c.accent : "transparent",
                      borderWidth: d.hecho ? 0 : d.hoy ? 2 : 1,
                      borderColor: d.hoy ? c.accent : c.line,
                      opacity: d.futuro ? 0.5 : 1,
                    }}
                  >
                    {d.hecho ? <Icono nombre="check" size={18} color={c.accentInk} trazo={2.4} /> : null}
                  </View>
                  <Text style={{ color: d.hoy ? c.ink : c.muted, fontFamily: fonts.medium, fontSize: 12 }}>{d.letra}</Text>
                </View>
              ))}
            </View>
          </View>
        </Entrada>

        <Entrada orden={2}>
          <GoalCard
            c={c}
            nombre={m.camino.nombre}
            hechos={m.camino.hechos}
            total={m.camino.total}
            fraccion={m.camino.fraccion}
            de={t.de}
            accion={m.camino.hechos > 0 || hero?.retomar ? t.continuar : t.empezar}
            onAccion={reproducir}
            onAbrir={() => router.push("/camino")}
          />
        </Entrada>

        {m.continuar ? (
          <Entrada orden={3}>
            <Pulsable onPress={() => router.push("/ahora")} label={m.continuar.titulo} style={{ borderRadius: 24, padding: 16, flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: c.card, borderWidth: 1, borderColor: c.line }}>
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

        <Entrada orden={5} style={{ gap: 20, marginTop: 8 }}>
          <Seccion c={c} titulo={t.explorar} />
          <Carril c={c} titulo={t.libros} items={m.explorar.libros} onPress={() => router.push("/biblioteca")} />
          <Carril c={c} titulo={t.caminos} items={m.explorar.caminos} onPress={() => router.push("/camino")} />
          <Carril c={c} titulo={t.retos} items={m.explorar.retos} onPress={(item) => (item.ruta ? router.push(item.ruta as "/reto-adviento") : undefined)} />
        </Entrada>
      </View>
    </ScrollView>
  );
}
