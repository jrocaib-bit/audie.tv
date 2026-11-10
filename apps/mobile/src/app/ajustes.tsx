import { IDIOMAS, PLAYBACK_RATES, t, type DailyMinutes, type ThemeChoice } from "@audite/domain";
import { useRouter } from "expo-router";
import { useColorScheme } from "react-native";
import { Pressable, ScrollView, Text } from "react-native";
import { useMobileLibrary } from "../state";
import { dark, light, ui } from "../theme";

export default function SettingsScreen() {
  const library = useMobileLibrary();
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = library.settings.theme === "dark" || (library.settings.theme === "system" && scheme === "dark") ? dark : light;
  const locale = library.settings.uiLocale;
  const themes: ThemeChoice[] = ["system", "light", "dark"];
  const minutes: DailyMinutes[] = [10, 15, 20, 30];
  const languages = IDIOMAS;
  return (
    <ScrollView contentContainerStyle={[ui.screen, { backgroundColor: colors.bg }]}>
      <Text style={[ui.title, { color: colors.ink }]}>{t(locale, "settingsTitle")}</Text>
      <Text style={[ui.body, { color: colors.ink }]}>{t(locale, "settingsTheme")}</Text>
      <ScrollView horizontal contentContainerStyle={ui.row}>
        {themes.map((theme) => (
          <Pressable key={theme} onPress={() => library.updateSettings({ theme })} style={[ui.button, { backgroundColor: library.settings.theme === theme ? colors.accent : colors.card }]}>
            <Text style={{ color: library.settings.theme === theme ? colors.accentInk : colors.ink }}>{theme}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <Text style={[ui.body, { color: colors.ink }]}>{t(locale, "settingsSpeed")}</Text>
      <ScrollView horizontal contentContainerStyle={ui.row}>
        {PLAYBACK_RATES.map((rate) => (
          <Pressable key={rate} onPress={() => library.setRate(rate)} style={[ui.button, { backgroundColor: library.settings.rate === rate ? colors.accent : colors.card }]}>
            <Text style={{ color: library.settings.rate === rate ? colors.accentInk : colors.ink }}>{rate}×</Text>
          </Pressable>
        ))}
      </ScrollView>
      <Text style={[ui.body, { color: colors.ink }]}>{t(locale, "settingsDaily")}</Text>
      <ScrollView horizontal contentContainerStyle={ui.row}>
        {minutes.map((value) => (
          <Pressable key={value} onPress={() => library.updateSettings({ dailyMinutes: value })} style={[ui.button, { backgroundColor: library.settings.dailyMinutes === value ? colors.accent : colors.card }]}>
            <Text style={{ color: library.settings.dailyMinutes === value ? colors.accentInk : colors.ink }}>{value} min</Text>
          </Pressable>
        ))}
      </ScrollView>
      <Text style={[ui.body, { color: colors.ink }]}>{t(locale, "settingsLanguage")}</Text>
      <ScrollView horizontal contentContainerStyle={ui.row}>
        {languages.map((value) => (
          <Pressable key={value} onPress={() => library.updateSettings({ uiLocale: value, localeElegido: true })} style={[ui.button, { backgroundColor: library.settings.uiLocale === value ? colors.accent : colors.card }]}>
            <Text style={{ color: library.settings.uiLocale === value ? colors.accentInk : colors.ink }}>{value}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <Pressable onPress={() => library.updateSettings({ captions: !library.settings.captions })} style={[ui.button, { backgroundColor: colors.card }]}>
        <Text style={{ color: colors.ink }}>
          {t(locale, "settingsCaptions")}: {library.settings.captions ? "on" : "off"}
        </Text>
      </Pressable>
      <Pressable onPress={() => router.push("/entrar")} style={[ui.button, { backgroundColor: colors.card }]}>
        <Text style={{ color: colors.ink }}>{locale === "en" ? "Sign in" : "Entrar"}</Text>
      </Pressable>
      <Pressable onPress={() => router.push("/leer")} style={[ui.button, { backgroundColor: colors.card }]}>
        <Text style={{ color: colors.ink }}>{locale === "es" ? "Lectura" : "Reading"}</Text>
      </Pressable>
      <Pressable onPress={() => router.push("/notas")} style={[ui.button, { backgroundColor: colors.card }]}>
        <Text style={{ color: colors.ink }}>{locale === "es" ? "Notas" : "Notes"}</Text>
      </Pressable>
      <Pressable onPress={() => router.push("/avisos")} style={[ui.button, { backgroundColor: colors.card }]}>
        <Text style={{ color: colors.ink }}>{locale === "es" ? "Avisos" : "Reminders"}</Text>
      </Pressable>
      <Pressable onPress={() => router.push("/descargas")} style={[ui.button, { backgroundColor: colors.card }]}>
        <Text style={{ color: colors.ink }}>{locale === "es" ? "Descargas" : "Downloads"}</Text>
      </Pressable>
      <Text style={[ui.body, { color: colors.muted }]}>{t(locale, "settingsAboutBody")}</Text>
    </ScrollView>
  );
}
