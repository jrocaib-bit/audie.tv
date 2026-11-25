import { IDIOMAS, esIdiomaAudio, esIdiomaInterfaz, idiomaAudioActivo, idiomaInterfazActivo, PLAYBACK_RATES, textosAlta, type DailyMinutes } from "@audite/domain";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { cerrarApp } from "../auth";
import { restaurarNativo } from "../compras/storekit";
import { URL_CONDICIONES, URL_PRIVACIDAD, restaurarCompras } from "../compras/tienda";
import { guardarRecordatorio, leerPlan } from "../recordatorio";
import { HORAS_RECORDATORIO, horaTexto, planDiario } from "../recordatorio-plan";
import { fonts } from "../theme";
import { tx } from "../textos";
import { useHuecoInferior } from "../ui/barra-flotante";
import { Chip } from "../ui/Basicos";
import { Entrada } from "../ui/Entrada";
import { Fila, Grupo, Interruptor, Segmentos } from "../ui/Fila";
import { Pulsable } from "../ui/Pulsable";
import { ScreenHeader } from "../ui/ScreenHeader";
import { Icono } from "../ui/Icono";
import { useTema } from "../ui/tema";
import { useEpisodioCargado } from "../ui/useHoy";
import { textoAviso } from "@audite/domain";

function FilaChips({ c, children }: { c: ReturnType<typeof useTema>["c"]; children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.line }}>
      {children}
    </View>
  );
}

export default function Ajustes() {
  const { c, lang, library } = useTema();
  const t = tx(lang);
  const copy = textosAlta(library.settings.uiLocale);
  const router = useRouter();
  const hueco = useHuecoInferior();
  const cargado = useEpisodioCargado();
  const sesion = library.sesion;
  const [aviso, setAviso] = useState<{ activo: boolean; hora: number }>({ activo: false, hora: 8 });
  useEffect(() => {
    void leerPlan().then((plan) => setAviso({ activo: plan.activo, hora: plan.hora }));
  }, []);

  const fijarAviso = (activo: boolean, hora: number) => {
    setAviso({ activo, hora });
    const texto = textoAviso(library.settings.uiLocale, cargado?.info.libro || "Audite", 1);
    void guardarRecordatorio(planDiario(hora, activo), texto);
  };
  const [idiomaAbierto, setIdiomaAbierto] = useState(false);
  const [audioAbierto, setAudioAbierto] = useState(false);
  const minutos: DailyMinutes[] = [10, 15, 20, 30];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ paddingBottom: 32 + hueco }} showsVerticalScrollIndicator={false}>
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
            <>
              <Fila c={c} icono="usuario" titulo={sesion.email ?? t.cuenta} />
              <Fila c={c} icono="usuario" titulo={copy.salir} onPress={() => void cerrarApp()} />
            </>
          ) : (
            <Fila c={c} icono="usuario" titulo={copy.entrar} onPress={() => router.push("/cuenta")} />
          )}
          <Fila c={c} icono="estrella" titulo="Audite Premium" onPress={() => router.push("/suscripcion")} ultima />
        </Grupo>

        <Grupo c={c}>
          <Fila c={c} icono="campana" titulo={t.recordatorio} valor={aviso.activo ? horaTexto(aviso.hora) : undefined} derecha={<Interruptor c={c} label={t.recordatorio} activo={aviso.activo} onCambiar={(v) => fijarAviso(v, aviso.hora)} />} />
          {aviso.activo ? (
            <Entrada>
              <FilaChips c={c}>
                {HORAS_RECORDATORIO.map((hora) => (
                  <Chip key={hora} c={c} texto={horaTexto(hora)} activo={aviso.hora === hora} onPress={() => fijarAviso(true, hora)} />
                ))}
              </FilaChips>
            </Entrada>
          ) : null}
          <Fila c={c} icono="reloj" titulo={t.minDia} valor={`${library.settings.dailyMinutes} min`} ultima={false} derecha={<View />} />
          <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
            <Segmentos c={c} lleno valor={library.settings.dailyMinutes} opciones={minutos.map((m) => ({ id: m, texto: `${m}` }))} onElegir={(m) => library.updateSettings({ dailyMinutes: m })} />
          </View>
        </Grupo>

        <Grupo c={c} titulo={t.tabBiblioteca}>
          <Fila c={c} icono="velocidad" titulo={t.velocidadAj} valor={`${library.settings.rate}×`} derecha={<View />} />
          <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
            <Segmentos c={c} lleno valor={library.settings.rate} opciones={PLAYBACK_RATES.map((r) => ({ id: r, texto: `${r}×` }))} onElegir={(r) => library.setRate(r)} />
          </View>
          <Fila c={c} icono="idioma" titulo={t.idiomaApp} valor={idiomaInterfazActivo(library.settings.uiLocale).toUpperCase()} onPress={() => setIdiomaAbierto((v) => !v)} derecha={<View style={{ transform: [{ rotate: idiomaAbierto ? "90deg" : "0deg" }] }}><Icono nombre="chevron" size={18} color={c.muted} /></View>} />
          {idiomaAbierto ? (
            <FilaChips c={c}>
              {IDIOMAS.map((id) => {
                const disponible = esIdiomaInterfaz(id);
                return (
                  <Chip
                    key={`ui-${id}`}
                    c={c}
                    texto={id.toUpperCase()}
                    activo={disponible && idiomaInterfazActivo(library.settings.uiLocale) === id}
                    proximo={!disponible}
                    etiquetaProximo={t.proximamente}
                    onPress={() => { library.updateSettings({ uiLocale: id, localeElegido: true }); setIdiomaAbierto(false); }}
                  />
                );
              })}
            </FilaChips>
          ) : null}
          <Fila c={c} icono="idioma" titulo={t.idiomaAudio} valor={idiomaAudioActivo(library.settings.audioLocale).toUpperCase()} onPress={() => setAudioAbierto((v) => !v)} derecha={<View style={{ transform: [{ rotate: audioAbierto ? "90deg" : "0deg" }] }}><Icono nombre="chevron" size={18} color={c.muted} /></View>} />
          {audioAbierto ? (
            <FilaChips c={c}>
              {IDIOMAS.map((id) => {
                const disponible = esIdiomaAudio(id);
                return (
                  <Chip
                    key={`audio-${id}`}
                    c={c}
                    texto={id.toUpperCase()}
                    activo={disponible && idiomaAudioActivo(library.settings.audioLocale) === id}
                    proximo={!disponible}
                    etiquetaProximo={t.proximamente}
                    onPress={() => { library.updateSettings({ audioLocale: id }); setAudioAbierto(false); }}
                  />
                );
              })}
            </FilaChips>
          ) : null}
          <Fila c={c} icono="texto" titulo={t.subtitulos} derecha={<Interruptor c={c} label={t.subtitulos} activo={library.settings.captions} onCambiar={(v) => library.updateSettings({ captions: v })} />} />
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
