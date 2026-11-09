import { booksOnTheWay, episodeById, journeyState, nombreCorto, playableByBook, t } from "@audite/domain";
import { useMemo } from "react";
import { FlatList, Text, useColorScheme, View } from "react-native";
import { useMobileLibrary } from "../state";
import { dark, fonts, light, ui } from "../theme";

export default function PathScreen() {
  const library = useMobileLibrary();
  const scheme = useColorScheme();
  const colors = library.settings.theme === "dark" || (library.settings.theme === "system" && scheme === "dark") ? dark : light;
  const locale = library.settings.uiLocale;
  const books = useMemo(() => booksOnTheWay(library.catalog.books), [library.catalog.books]);
  const byBook = useMemo(() => playableByBook(library.catalog.episodes), [library.catalog.episodes]);
  return (
    <FlatList
      data={books}
      keyExtractor={(book) => book.id}
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: 120 }}
      initialNumToRender={18}
      ListHeaderComponent={
        <View style={{ paddingHorizontal: 22, paddingTop: 12, gap: 12, marginBottom: 8 }}>
          <Text style={[ui.kicker, { color: colors.muted }]}>{t(locale, "navPath")}</Text>
          <Text style={[ui.title, { color: colors.ink }]}>{t(locale, "pathTitle")}</Text>
          <Text style={[ui.body, { color: colors.muted }]}>{t(locale, "pathIntro")}</Text>
          {library.path.steps.map((step) => {
            const item = episodeById(library.catalog, step.episodeId);
            if (!item) return null;
            return (
              <Text key={step.episodeId} style={{ color: colors.ink, fontFamily: fonts.serif, fontSize: 22 }}>
                {nombreCorto(item, locale)}
              </Text>
            );
          })}
        </View>
      }
      renderItem={({ item }) => {
        const state = journeyState(item.id, library.path, library.progress, byBook);
        const label = state === "heard" ? t(locale, "journeyHeard") : state === "ahead" ? t(locale, "journeyAhead") : t(locale, "journeyCurrent");
        return (
          <View style={{ marginHorizontal: 22, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line, flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
            <Text style={{ color: state === "ahead" ? colors.muted : colors.ink, fontFamily: fonts.serif, fontSize: 24, flex: 1 }}>{item.name[locale] || item.name.es}</Text>
            <Text style={{ color: colors.muted, fontFamily: fonts.sans, fontSize: 13, paddingTop: 8 }}>{label}</Text>
          </View>
        );
      }}
    />
  );
}
