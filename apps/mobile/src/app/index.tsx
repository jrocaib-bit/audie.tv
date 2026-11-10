import { idiomaContenido, creditoVisible, listeningDayCount, nombreEpisodio, t } from "@audite/domain";
import { ScrollView, Text, useColorScheme } from "react-native";
import { useMobileLibrary } from "../state";
import { dark, fonts, light, ui } from "../theme";

export default function Today() {
  const library = useMobileLibrary();
  const scheme = useColorScheme();
  const colors = library.settings.theme === "dark" || (library.settings.theme === "system" && scheme === "dark") ? dark : light;
  const locale = library.settings.uiLocale;
  const primero = library.catalog.pendientes.find((episodio) => episodio.bookId === "gn") ?? library.catalog.pendientes[0];
  const fuente = library.catalog.fuenteTexto[idiomaContenido(locale)];
  return (
    <ScrollView contentContainerStyle={[ui.screen, { backgroundColor: colors.bg }]}>
      <Text style={[ui.kicker, { color: colors.muted }]}>{t(locale, "todayEyebrow")}</Text>
      <Text style={[ui.title, { color: colors.ink }]}>{t(locale, "listenComingTitle")}</Text>
      <Text style={[ui.body, { color: colors.muted }]}>
        {t(locale, "todayDays")} · {listeningDayCount(library.progress.listenedOn ?? [])}
      </Text>
      {primero ? (
        <>
          <Text style={[ui.kicker, { color: colors.muted }]}>{primero.capitulos ?? ""}</Text>
          <Text style={{ color: colors.ink, fontFamily: fonts.serif, fontSize: 34, lineHeight: 40 }}>{nombreEpisodio(primero, locale)}</Text>
          <Text style={[ui.body, { color: colors.muted }]}>
            {primero.presentacion === "revision" ? t(locale, "statusReview") : t(locale, "statusPreparing")}
          </Text>
        </>
      ) : null}
      <Text style={[ui.body, { color: colors.muted }]}>{t(locale, "listenComingBody")}</Text>
      <Text style={[ui.body, { color: colors.muted }]}>
        {creditoVisible(fuente, t(locale, "sourceLabel"), t(locale, "sourcePending"))}
      </Text>
    </ScrollView>
  );
}
