import { localIsoDate } from "@audite/domain";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fechaCorta, modeloRetos, ventanaDeReto, type TarjetaReto } from "../temporadas";
import { fonts } from "../theme";
import { tituloRetoBiblia, tx } from "../textos";
import { Boton } from "../ui/Basicos";
import { Entrada } from "../ui/Entrada";
import { ObraMarco } from "../ui/ObraMarco";
import { ProgressBar } from "../ui/ProgressBar";
import { Pulsable } from "../ui/Pulsable";
import { RetoCard } from "../ui/RetoCard";
import { ScreenHeader } from "../ui/ScreenHeader";
import { useTema } from "../ui/tema";
import { useReproducir } from "../ui/useReproducir";

export function chipDeReto(tarjeta: TarjetaReto, lang: "es" | "en") {
  const t = tx(lang);
  if (tarjeta.estado === "en-curso") return { texto: t.enCurso, activo: true };
  if (tarjeta.estado === "terminado") return { texto: t.terminado, activo: false };
  return { texto: `${t.empiezaEl} ${fechaCorta(ventanaDeReto(tarjeta.id).inicio, lang)}`, activo: false };
}

export default function Retos() {
  const { c, lang, library } = useTema();
  const t = tx(lang);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reproducirId = useReproducir();
  const hoyIso = localIsoDate(new Date());
  const m = useMemo(
    () => modeloRetos({ lang, hoyIso, progress: library.progress, rangos: library.catalog.rangos }),
    [hoyIso, lang, library.catalog.rangos, library.progress],
  );
  const p = m.principal;
  const grabados = useMemo(() => new Set(library.catalog.episodes.map((e) => e.id)), [library.catalog.episodes]);

  const unirme = () => {
    library.updateSettings({ caminoActivo: "biblia" });
    if (p.siguiente && grabados.has(p.siguiente)) {
      reproducirId(p.siguiente, { contexto: { tipo: "camino", id: "biblia" } });
    } else {
      router.navigate("/camino");
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ paddingBottom: 32 + insets.bottom }} showsVerticalScrollIndicator={false}>
      <ScreenHeader c={c} titulo={t.tabRetos} />
      <View style={{ paddingHorizontal: 20, gap: 14, paddingTop: 8 }}>
        <Entrada orden={0}>
          <View style={{ borderRadius: 28, backgroundColor: c.card, borderWidth: 1, borderColor: c.line, overflow: "hidden" }}>
            <ObraMarco src={p.src} style={{ height: 180 }} />
            <View style={{ padding: 20, gap: 12 }}>
              <Text accessibilityRole="header" style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 28, lineHeight: 32 }}>{tituloRetoBiblia(lang)}</Text>
              <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
                <Text style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 44, lineHeight: 48 }}>{p.hechos}</Text>
                <Text style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 16 }}>{t.de} {p.total}</Text>
              </View>
              <ProgressBar fraccion={p.fraccion} color={c.accent} pista={c.line} alto={8} />
              <Boton c={c} texto={p.hechos > 0 ? t.continuar : t.unirme} onPress={unirme} />
            </View>
          </View>
        </Entrada>

        <Text accessibilityRole="header" style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 20, marginTop: 8 }}>{t.temporadas}</Text>
        {m.temporadas.map((reto, i) => (
          <Entrada key={reto.id} orden={Math.min(i, 5) + 1}>
            <RetoCard
              c={c}
              titulo={reto.titulo}
              src={reto.src}
              hechos={reto.hechos}
              total={reto.total}
              fraccion={reto.fraccion}
              de={t.de}
              fechas={reto.fechas}
              chip={chipDeReto(reto, lang)}
              destacado={reto.destacado}
              sinObra={reto.sinObra}
              onPress={() => router.push(`/reto/${reto.id}`)}
            />
          </Entrada>
        ))}
      </View>
    </ScrollView>
  );
}
