import { booksOnTheWay, creditoVisible, episodiosDeLibro, playableEpisodes, rotuloEpisodio, t, type PendingEpisode } from "@audite/domain";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, Text, useColorScheme, View } from "react-native";
import { useMobileLibrary } from "../state";
import { dark, fonts, light, ui } from "../theme";

export default function LibraryScreen() {
  const library = useMobileLibrary();
  const scheme = useColorScheme();
  const colors = library.settings.theme === "dark" || (library.settings.theme === "system" && scheme === "dark") ? dark : light;
  const locale = library.settings.uiLocale;
  const libros = useMemo(() => booksOnTheWay(library.catalog.books), [library.catalog.books]);
  const [abierto, setAbierto] = useState(libros.some((libro) => libro.id === "gn") ? "gn" : libros[0]?.id ?? "");
  const [remotos, setRemotos] = useState<{ libro: string; episodios: PendingEpisode[] } | null>(null);
  useEffect(() => {
    if (library.catalog.pendientes.some((episodio) => episodio.bookId === abierto)) return;
    const base = process.env.EXPO_PUBLIC_CONTENT_BASE ?? "http://127.0.0.1:43123";
    let cancelado = false;
    void fetch(`${base}/api/libro/${abierto}`)
      .then((respuesta) => (respuesta.ok ? respuesta.json() : null))
      .then((dato: { episodios?: PendingEpisode[] } | null) => {
        if (!cancelado) setRemotos({ libro: abierto, episodios: dato?.episodios ?? [] });
      })
      .catch(() => {
        if (!cancelado) setRemotos({ libro: abierto, episodios: [] });
      });
    return () => {
      cancelado = true;
    };
  }, [abierto, library.catalog.pendientes]);
  const episodios = useMemo(() => {
    const locales = episodiosDeLibro(library.catalog.pendientes, abierto);
    if (locales.length > 0) return locales;
    return remotos?.libro === abierto ? remotos.episodios : [];
  }, [abierto, library.catalog.pendientes, remotos]);
  const episode = playableEpisodes(library.catalog)[0];
  const fuente = library.catalog.fuenteTexto[locale];
  return (
    <FlatList
      data={episodios}
      keyExtractor={(episodio) => episodio.id}
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: 120 }}
      initialNumToRender={12}
      windowSize={7}
      ListHeaderComponent={
        <View style={{ paddingHorizontal: 22, paddingTop: 12, gap: 14 }}>
          <Text style={[ui.kicker, { color: colors.muted }]}>{t(locale, "navLibrary")}</Text>
          <Text style={[ui.title, { color: colors.ink }]}>{t(locale, "catalogTitle")}</Text>
          <Text style={[ui.body, { color: colors.muted }]}>{t(locale, "libraryQuiet")}</Text>
          <Text style={[ui.body, { color: colors.muted }]}>
            {creditoVisible(fuente, t(locale, "sourceLabel"), t(locale, "sourcePending"))}
          </Text>
          {episode ? <Text style={{ color: colors.ink, fontFamily: fonts.serif, fontSize: 28 }}>{episode.title}</Text> : null}
          <FlatList
            horizontal
            data={libros}
            keyExtractor={(libro) => libro.id}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => {
              const activo = item.id === abierto;
              return (
                <Pressable accessibilityRole="button" accessibilityState={{ selected: item.id === abierto }} onPress={() => setAbierto(item.id)} style={{ marginRight: 16, minHeight: 44, justifyContent: "center" }}>
                  <Text style={{ color: activo ? colors.ink : colors.muted, fontFamily: fonts.serif, fontSize: 22 }}>{item.name[locale] || item.name.es}</Text>
                </Pressable>
              );
            }}
          />
        </View>
      }
      renderItem={({ item }) => (
        <View style={{ marginHorizontal: 22, marginBottom: 10, padding: 16, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card }}>
          {item.propuesta ? <Text style={[ui.kicker, { color: colors.muted }]}>{t(locale, "statusProposed")}</Text> : null}
          <Text style={{ color: colors.ink, fontFamily: fonts.serif, fontSize: 28, lineHeight: 34 }}>{rotuloEpisodio(item, locale) ?? t(locale, "comingSoon")}</Text>
          <Text style={[ui.body, { color: colors.muted }]}>
            {item.capitulos ?? ""}
            {item.capitulos ? " · " : ""}
            {item.presentacion === "revision" ? t(locale, "statusReview") : t(locale, "statusPreparing")}
          </Text>
        </View>
      )}
    />
  );
}
