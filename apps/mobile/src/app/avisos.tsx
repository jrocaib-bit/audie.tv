import { textoAviso, type PlanAviso } from "@audite/domain";
import { useState } from "react";
import { Pressable, Text } from "react-native";
import { ScrollView } from "react-native";
import { programarAvisosLocales } from "../avisos";
import { useMobileLibrary } from "../state";
import { dark, light, ui } from "../theme";

export default function Avisos() {
  const library = useMobileLibrary();
  const locale = library.settings.uiLocale;
  const colors = library.settings.theme === "light" ? light : dark;
  const [plan, setPlan] = useState<PlanAviso>({ activo: false, hora: 8, minuto: 0, dias: [1, 2, 3, 4, 5] });
  const [cuantos, setCuantos] = useState<number | null>(null);
  const texto = textoAviso(locale, locale === "en" ? "Genesis" : "Génesis", 3);
  return (
    <ScrollView contentContainerStyle={[ui.screen, { backgroundColor: colors.bg }]}>
      <Text style={[ui.title, { color: colors.ink }]}>{locale === "en" ? "Reminders" : "Avisos"}</Text>
      <Text style={[ui.body, { color: colors.muted }]}>{locale === "en" ? "Scheduled on this device. No push server." : "Programados en este dispositivo. Sin servidor push."}</Text>
      <Pressable onPress={() => setPlan((actual) => ({ ...actual, activo: !actual.activo }))} style={[ui.button, { backgroundColor: plan.activo ? colors.accent : colors.card }]}>
        <Text style={{ color: plan.activo ? colors.accentInk : colors.ink }}>{plan.activo ? (locale === "en" ? "On" : "Activados") : (locale === "en" ? "Off" : "Desactivados")}</Text>
      </Pressable>
      <Text style={[ui.title, { color: colors.ink, fontSize: 32 }]}>{texto}</Text>
      <Pressable
        onPress={() => void programarAvisosLocales(plan, texto).then(setCuantos)}
        style={[ui.button, { backgroundColor: colors.accent }]}
      >
        <Text style={{ color: colors.accentInk }}>{locale === "en" ? "Schedule" : "Programar"}</Text>
      </Pressable>
      {cuantos != null ? <Text style={[ui.body, { color: colors.ink }]}>{cuantos}</Text> : null}
    </ScrollView>
  );
}
