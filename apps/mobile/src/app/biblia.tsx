import { nombreDeCapitulo, t, type LibroIndice } from "@audite/domain";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { detalleDeCapitulo, filtrarIndice, indiceBiblia, type FiltroTestamento } from "../biblia";
import { useTema } from "../ui/tema";
import { dark, fonts, ui } from "../theme";

type Colores = typeof dark;

const CELDA = 44;

function Capitulos({ libro, colors, locale, elegido, alElegir }: { libro: LibroIndice; colors: Colores; locale: string; elegido: number | null; alElegir: (n: number) => void }) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, paddingTop: 10 }}>
      {libro.capitulos.map((capitulo) => {
        const activo = elegido === capitulo.n;
        const unido = Boolean(capitulo.unido);
        const vacio = capitulo.episodios.length === 0 && !unido;
        return (
          <Pressable
            key={capitulo.n}
            accessibilityRole="button"
            accessibilityLabel={nombreDeCapitulo(libro, capitulo.n, locale)}
            accessibilityState={{ selected: activo, disabled: vacio }}
            disabled={vacio}
            onPress={() => alElegir(capitulo.n)}
            style={{
              minWidth: CELDA,
              minHeight: CELDA,
              borderRadius: 8,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: activo ? colors.accent : unido || vacio ? "transparent" : colors.line,
              borderWidth: unido || vacio ? 1 : 0,
              borderStyle: "dashed",
              borderColor: unido ? colors.accent : colors.line,
            }}
          >
            <Text style={{ color: activo ? colors.accentInk : unido ? colors.accent : vacio ? colors.muted : colors.ink, fontFamily: fonts.medium, fontSize: 16 }}>{capitulo.n}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Detalle({ libro, n, colors, locale, disponibles, alEscuchar }: { libro: LibroIndice; n: number; colors: Colores; locale: string; disponibles: ReadonlySet<string>; alEscuchar: () => void }) {
  const capitulo = libro.capitulos.find((item) => item.n === n);
  if (!capitulo) return null;
  const detalle = detalleDeCapitulo(libro, capitulo, locale, disponibles);
  return (
    <View accessibilityLiveRegion="polite" style={{ marginTop: 12, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.bg, gap: 6 }}>
      <Text style={{ color: colors.ink, fontFamily: fonts.serif, fontSize: 22 }}>{detalle.nombre}</Text>
      {detalle.nota ? <Text style={[ui.body, { color: colors.muted }]}>{detalle.nota}</Text> : null}
      {detalle.destinos.length > 1 ? <Text style={[ui.body, { color: colors.muted }]}>{t(locale, "bibleSeveral")}</Text> : null}
      {detalle.destinos.map((destino) => (
        <View key={destino.id} style={{ gap: 4, paddingTop: 4 }}>
          <Text style={[ui.body, { color: colors.muted }]}>{t(locale, "bibleListenIn")}</Text>
          <Text style={{ color: colors.ink, fontFamily: fonts.serif, fontSize: 20, lineHeight: 26 }}>{destino.titulo}</Text>
          <Text style={[ui.body, { color: colors.muted }]}>
            {destino.tramo}
            {destino.inicio ? ` · ${t(locale, "bibleStartsAt")} ${destino.inicio}` : ""}
          </Text>
          {destino.disponible ? (
            <Pressable accessibilityRole="button" onPress={alEscuchar} style={[ui.button, { backgroundColor: colors.accent, marginTop: 6 }]}>
              <Text style={[ui.buttonText, { color: colors.accentInk }]}>{t(locale, "bibleListenNow")}</Text>
            </Pressable>
          ) : (
            <Text style={[ui.body, { color: colors.muted }]}>{t(locale, "statusPreparing")}</Text>
          )}
        </View>
      ))}
    </View>
  );
}

export default function BibleScreen() {
  const { c: colors, library } = useTema();
  const router = useRouter();
  const locale = library.settings.uiLocale;
  const idioma = locale === "en" ? "en" : "es";
  const [consulta, setConsulta] = useState("");
  const [testamento, setTestamento] = useState<FiltroTestamento>("todos");
  const [abierto, setAbierto] = useState<string | null>(null);
  const [elegido, setElegido] = useState<number | null>(null);
  const testamentos = useMemo(() => filtrarIndice(indiceBiblia, consulta, testamento), [consulta, testamento]);
  // La app reproduce hoy el episodio del catálogo local. El resto queda en preparación y no se finge.
  const disponibles = useMemo(() => new Set(library.catalog.episodes.map((episodio) => episodio.id)), [library.catalog.episodes]);
  const filtros: [FiltroTestamento, string][] = [
    ["todos", t(locale, "bibleAll")],
    ["at", indiceBiblia.testamentos[0]!.titulo[idioma]],
    ["nt", indiceBiblia.testamentos[1]!.titulo[idioma]],
  ];
  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={ui.screen} keyboardShouldPersistTaps="handled">
      <Text style={[ui.kicker, { color: colors.muted }]}>{t(locale, "bibleKicker")}</Text>
      <Text accessibilityRole="header" style={[ui.title, { color: colors.ink }]}>{t(locale, "bibleTitle")}</Text>
      <Text style={[ui.body, { color: colors.muted }]}>{t(locale, "bibleIntro")}</Text>
      <View style={{ padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, gap: 10 }}>
        <Text style={[ui.body, { color: colors.ink }]}>{t(locale, "bibleTrialBody")}</Text>
        <Pressable accessibilityRole="button" onPress={() => router.push("/suscripcion")} style={[ui.button, { backgroundColor: colors.accent }]}>
          <Text style={[ui.buttonText, { color: colors.accentInk }]}>{t(locale, "bibleTrial")}</Text>
        </Pressable>
      </View>
      <TextInput
        value={consulta}
        onChangeText={setConsulta}
        placeholder={t(locale, "bibleFind")}
        placeholderTextColor={colors.muted}
        accessibilityLabel={t(locale, "bibleFind")}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        style={{ minHeight: 48, borderRadius: 999, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, paddingHorizontal: 18, color: colors.ink, fontFamily: fonts.sans, fontSize: 16 }}
      />
      <View style={ui.row}>
        {filtros.map(([id, rotulo]) => {
          const activo = testamento === id;
          return (
            <Pressable
              key={id}
              accessibilityRole="button"
              accessibilityState={{ selected: activo }}
              onPress={() => setTestamento(id)}
              style={{ minHeight: 44, paddingHorizontal: 14, borderRadius: 999, justifyContent: "center", borderWidth: 1, borderColor: activo ? colors.accent : colors.line, backgroundColor: activo ? colors.accent : "transparent" }}
            >
              <Text style={{ color: activo ? colors.accentInk : colors.ink, fontFamily: fonts.medium, fontSize: 14 }}>{rotulo}</Text>
            </Pressable>
          );
        })}
      </View>
      {testamentos.length === 0 ? <Text style={[ui.body, { color: colors.muted }]}>{t(locale, "bibleTryAnother")}</Text> : null}
      {testamentos.map((bloque) => (
        <View key={bloque.id} style={{ gap: 10 }}>
          <Text accessibilityRole="header" style={{ color: colors.ink, fontFamily: fonts.serif, fontSize: 30, lineHeight: 36, marginTop: 8 }}>{bloque.titulo[idioma]}</Text>
          {bloque.secciones.map((seccion) => (
            <View key={seccion.id} style={{ gap: 8 }}>
              <Text accessibilityRole="header" style={[ui.kicker, { color: colors.muted, marginTop: 6 }]}>{seccion.titulo[idioma]}</Text>
              {seccion.libros.map((libro) => {
                const expandido = abierto === libro.id;
                const total = libro.capitulos.length;
                return (
                  <View key={libro.id} style={{ borderRadius: 12, borderWidth: 1, borderColor: expandido ? colors.accent : colors.line, backgroundColor: colors.card, paddingHorizontal: 14, paddingBottom: expandido ? 14 : 0 }}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ expanded: expandido }}
                      onPress={() => {
                        setAbierto(expandido ? null : libro.id);
                        setElegido(null);
                      }}
                      style={{ minHeight: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}
                    >
                      <Text style={{ color: colors.ink, fontFamily: fonts.serif, fontSize: 20, flexShrink: 1 }}>{libro.titulo[idioma]}</Text>
                      <Text style={{ color: colors.muted, fontFamily: fonts.sans, fontSize: 14 }}>{`${total} ${total === 1 ? t(locale, "bibleChapter") : t(locale, "bibleChapters")}`}</Text>
                    </Pressable>
                    {expandido ? (
                      <>
                        <Capitulos libro={libro} colors={colors} locale={locale} elegido={elegido} alElegir={setElegido} />
                        {elegido != null ? <Detalle libro={libro} n={elegido} colors={colors} locale={locale} disponibles={disponibles} alEscuchar={() => router.push("/ahora")} /> : null}
                      </>
                    ) : null}
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}
