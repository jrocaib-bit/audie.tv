import { IDIOMAS, PLAYBACK_RATES, textosAlta, type DailyMinutes, type Sesion, type ThemeChoice } from "@audite/domain";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { cerrarApp, sesionApp } from "../auth";
import { restaurarNativo } from "../compras/storekit";
import { URL_CONDICIONES, URL_PRIVACIDAD, restaurarCompras } from "../compras/tienda";
import { guardarRecordatorio, leerPlan } from "../recordatorio";
import { HORAS_RECORDATORIO, horaTexto, planDiario } from "../recordatorio-plan";
import { fonts } from "../theme";
import { tx } from "../textos";
import { Chip } from "../ui/Basicos";
import { Entrada } from "../ui/Entrada";
import { Fila, Grupo, Segmentos } from "../ui/Fila";
import { Pulsable } from "../ui/Pulsable";
import { ScreenHeader } from "../ui/ScreenHeader";
import { Icono } from "../ui/Icono";
import { useTema } from "../ui/tema";
import { useEpisodioCargado } from "../ui/useHoy";
import { textoAviso } from "@audite/domain";

function FilaChips({ c, children }: { c: ReturnType<typeof useTema>["c"]; children: React.ReactNode }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: 12 }} style={{ borderBottomWidth: 1, borderBottomColor: c.line }}>
      {children}
    </ScrollView>
  );
}

export default function Ajustes() {
  const { c, lang, library } = useTema();
  const t = tx(lang);
  const copy = textosAlta(library.settings.uiLocale);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cargado = useEpisodioCargado();
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [aviso, setAviso] = useState<{ activo: boolean; hora: number }>({ activo: false, hora: 8 });
  useEffect(() => {
    void sesionApp().then(setSesion);
    void leerPlan().then((plan) => setAviso({ activo: plan.activo, hora: plan.hora }));
  }, []);

  const fijarAviso = (activo: boolean, hora: number) => {
    setAviso({ activo, hora });
    const texto = textoAviso(library.settings.uiLocale, cargado?.info.libro || "Audite", 1);
    void guardarRecordatorio(planDiario(hora, activo), texto);
  };
  const temas: { id: ThemeChoice; texto: string }[] = [
    { id: "system", texto: t.sistema },
    { id: "light", texto: t.claro },
    { id: "dark", texto: t.oscuro },
  ];
  const minutos: DailyMinutes[] = [10, 15, 20, 30];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ paddingBottom: 32 + insets.bottom }} showsVerticalScrollIndicator={false}>
      <ScreenHeader
        c={c}
        titulo={t.tabAjustes}
        derecha={
          <Pulsable onPress={() => router.push("/suscripcion")} label={t.premium} haptica escala={0.94} style={{ minHeight: 44, paddingHorizontal: 16, borderRadius: 999, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: c.accent }}>
            <Icono nombre="estrella" size={16} color={c.accentInk} />
            <Text style={{ color: c.accentInk, fontFamily: fonts.medium, fontSize: 14, fontWeight: "600" }}>{t.premium}</Text>
          </Pulsable>
        }
      />
      <Entrada style={{ paddingHorizontal: 20, gap: 20, paddingTop: 8 }}>
        <Grupo c={c} titulo={t.cuenta}>
          {sesion ? (
            <Fila c={c} icono="usuario" titulo={t.salir} onPress={() => void cerrarApp().then(() => setSesion(null))} />
          ) : (
            <Fila c={c} icono="usuario" titulo={copy.entrar} onPress={() => router.push("/entrar")} />
          )}
          <Fila c={c} icono="estrella" titulo="Audite Premium" onPress={() => router.push("/suscripcion")} ultima />
        </Grupo>

        <Grupo c={c} titulo={t.recordatorio}>
          <Fila c={c} icono="campana" titulo={t.recordatorio} valor={aviso.activo ? horaTexto(aviso.hora) : t.desactivado} derecha={<Segmentos c={c} valor={aviso.activo ? 1 : 0} opciones={[{ id: 0, texto: t.desactivado }, { id: 1, texto: t.activado }]} onElegir={(v) => fijarAviso(v === 1, aviso.hora)} />} />
          <FilaChips c={c}>
            {HORAS_RECORDATORIO.map((hora) => (
              <Chip key={hora} c={c} texto={horaTexto(hora)} activo={aviso.activo && aviso.hora === hora} onPress={() => fijarAviso(true, hora)} />
            ))}
          </FilaChips>
          <Fila c={c} icono="reloj" titulo={t.minDia} valor={`${library.settings.dailyMinutes} min`} ultima derecha={<View />} />
          <FilaChips c={c}>
            {minutos.map((m) => (
              <Chip key={m} c={c} texto={`${m} min`} activo={library.settings.dailyMinutes === m} onPress={() => library.updateSettings({ dailyMinutes: m })} />
            ))}
          </FilaChips>
        </Grupo>

        <Grupo c={c} titulo={t.tabBiblioteca}>
          <Fila c={c} icono="velocidad" titulo={t.velocidadAj} valor={`${library.settings.rate}×`} derecha={<View />} />
          <FilaChips c={c}>
            {PLAYBACK_RATES.map((rate) => (
              <Chip key={rate} c={c} texto={`${rate}×`} activo={library.settings.rate === rate} onPress={() => library.setRate(rate)} />
            ))}
          </FilaChips>
          <Fila c={c} icono="idioma" titulo={t.idioma} derecha={<Segmentos c={c} valor={library.settings.uiLocale} opciones={IDIOMAS.map((id) => ({ id, texto: id.toUpperCase() }))} onElegir={(id) => library.updateSettings({ uiLocale: id, localeElegido: true })} />} />
          <Fila c={c} icono="luna" titulo={t.apariencia} derecha={<Segmentos c={c} valor={library.settings.theme} opciones={temas} onElegir={(theme) => library.updateSettings({ theme })} />} />
          <Fila c={c} icono="texto" titulo={t.subtitulos} derecha={<Segmentos c={c} valor={library.settings.captions ? 1 : 0} opciones={[{ id: 0, texto: t.desactivado }, { id: 1, texto: t.activado }]} onElegir={(v) => library.updateSettings({ captions: v === 1 })} />} />
          <Fila c={c} icono="descarga" titulo={t.descargas} onPress={() => router.push("/descargas")} />
          <Fila c={c} icono="libro" titulo={t.lectura} onPress={() => router.push("/leer")} />
          <Fila c={c} icono="libro" titulo={t.notas} onPress={() => router.push("/notas")} ultima />
        </Grupo>

        <Grupo c={c} titulo={t.legal}>
          <Fila c={c} icono="info" titulo={t.creditos} onPress={() => router.push("/creditos")} />
          <Fila c={c} icono="info" titulo={t.privacidad} onPress={() => void Linking.openURL(URL_PRIVACIDAD)} />
          <Fila c={c} icono="info" titulo={t.terminos} onPress={() => void Linking.openURL(URL_CONDICIONES)} />
          <Fila c={c} icono="estrella" titulo={t.restaurar} onPress={() => void restaurarCompras({ restaurar: restaurarNativo }, Date.now(), undefined, sesion?.userId ?? null)} />
          <Fila c={c} icono="ayuda" titulo={t.ayuda} valor="soporte@audite.tv" onPress={() => void Linking.openURL("mailto:soporte@audite.tv")} ultima />
        </Grupo>

        <Grupo c={c}>
          <Fila c={c} icono="borrar" titulo={t.eliminar} onPress={() => router.push("/eliminar-cuenta")} peligro ultima />
        </Grupo>
      </Entrada>
    </ScrollView>
  );
}
