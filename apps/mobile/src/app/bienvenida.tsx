import { textoAviso } from "@audite/domain";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { obraDeEpisodio, obraWebp } from "../../../../packages/content/src/obras-visibles";
import { caminosDisponibles } from "../caminos";
import { guardarRecordatorio } from "../recordatorio";
import { HORAS_RECORDATORIO, horaTexto, planDiario } from "../recordatorio-plan";
import { dark, fonts } from "../theme";
import { tx } from "../textos";
import { Boton, Chip } from "../ui/Basicos";
import { Entrada } from "../ui/Entrada";
import { Interruptor } from "../ui/Fila";
import { CuentaForm } from "../ui/CuentaForm";
import { useReproducir } from "../ui/useReproducir";
import { Icono } from "../ui/Icono";
import { uriDeObra } from "../entorno";
import { Pulsable } from "../ui/Pulsable";
import { haptico, useTema } from "../ui/tema";
import { useModeloHoy } from "../ui/useHoy";

const c = dark;
const FONDOS = ["gn-03", "gn-14", "jn-05", "mt-01"].map((id) => {
  const obra = obraDeEpisodio(id);
  return obra ? obraWebp(obra) : "";
});

export default function Bienvenida() {
  const { lang, library } = useTema();
  const t = tx(lang);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const hoy = useModeloHoy();
  const reproducirId = useReproducir();
  const [paso, setPaso] = useState(0);
  const [hora, setHora] = useState(8);
  const [avisar, setAvisar] = useState(true);
  const caminos = caminosDisponibles(library.catalog.rangos);

  const terminar = (escuchar: boolean) => {
    library.updateSettings({ bienvenidaHecha: true });
    router.replace("/");
    if (escuchar && hoy.hero?.reproducible) reproducirId(hoy.hero.id, { contexto: { tipo: "camino", id: library.settings.caminoActivo || "biblia" } });
  };
  const recordar = () => {
    const texto = textoAviso(library.settings.uiLocale, hoy.hero?.libro || "Audite", 1);
    void guardarRecordatorio(planDiario(hora, avisar), texto);
    setPaso(library.sesion ? 3 : 2);
  };

  // Si la cuenta se crea en este paso, se pasa al final.
  useEffect(() => {
    if (paso === 2 && library.sesion) setPaso(3);
  }, [library.sesion, paso]);
  const pasosTotales = library.sesion && paso !== 2 ? 3 : 4;
  const puntoActivo = library.sesion && paso === 3 ? 2 : paso;

  return (
    <View style={{ flex: 1, backgroundColor: c.gallery }}>
      <Image source={{ uri: uriDeObra(FONDOS[paso] ?? "") }} resizeMode="cover" accessibilityElementsHidden style={StyleSheet.absoluteFill} />
      <LinearGradient colors={["rgba(12,11,9,0.2)", "rgba(12,11,9,0.55)", "rgba(12,11,9,0.97)"]} locations={[0, 0.35, 0.72]} style={StyleSheet.absoluteFill} pointerEvents="none" />
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 20, flexDirection: "row", justifyContent: "flex-end" }}>
        <Pulsable onPress={() => terminar(false)} label={t.saltar} hitSlop={8} style={{ minHeight: 44, paddingHorizontal: 14, justifyContent: "center", borderRadius: 999, backgroundColor: "rgba(12,11,9,0.55)" }}>
          <Text style={{ color: c.ink, fontFamily: fonts.medium, fontSize: 15 }}>{t.saltar}</Text>
        </Pulsable>
      </View>
      <View style={{ flex: 1 }} />
      <Entrada key={paso} style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 24, gap: 20 }}>
        <Text accessibilityRole="header" style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 46, lineHeight: 50 }}>{[t.b1, t.b2, t.crearCuenta, t.todoListo][paso]}</Text>

        {paso === 0 ? (
          <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {caminos.map((camino) => {
              const activo = library.settings.caminoActivo === camino.id;
              return (
                <Pulsable key={camino.id} onPress={() => { haptico(); library.updateSettings({ caminoActivo: camino.id }); }} selected={activo} label={camino.nombre[lang]} style={{ minHeight: 60, paddingHorizontal: 20, borderRadius: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: activo ? "rgba(224,196,138,0.2)" : "rgba(244,236,226,0.08)", borderWidth: 1.5, borderColor: activo ? c.accent : "transparent" }}>
                  <Text style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 24 }}>{camino.nombre[lang]}</Text>
                  {activo ? <Icono nombre="check" size={22} color={c.accent} /> : null}
                </Pulsable>
              );
            })}
          </ScrollView>
        ) : null}

        {paso === 1 ? (
          <View style={{ gap: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 56, paddingHorizontal: 20, borderRadius: 20, backgroundColor: "rgba(244,236,226,0.08)" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <Icono nombre="campana" size={22} color={c.accent} />
                <Text style={{ color: c.ink, fontFamily: fonts.medium, fontSize: 17 }}>{t.recordarme}</Text>
              </View>
              <Interruptor c={c} activo={avisar} onCambiar={setAvisar} label={t.recordarme} />
            </View>
            {avisar ? (
              <Entrada style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                {HORAS_RECORDATORIO.map((h) => (
                  <Chip key={h} c={c} texto={horaTexto(h)} activo={hora === h} onPress={() => setHora(h)} />
                ))}
              </Entrada>
            ) : null}
          </View>
        ) : null}

        {paso === 0 ? <Boton c={c} texto={t.siguiente} onPress={() => setPaso(1)} /> : null}
        {paso === 1 ? <Boton c={c} texto={t.siguiente} onPress={recordar} /> : null}
        {paso === 2 ? (
          <View style={{ gap: 4 }}>
            <CuentaForm lang={lang} ubicacion="bienvenida" />
            <Pulsable onPress={() => setPaso(3)} label={t.ahoraNo} style={{ minHeight: 48, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: c.muted, fontFamily: fonts.medium, fontSize: 15 }}>{t.ahoraNo}</Text>
            </Pulsable>
          </View>
        ) : null}
        {paso === 3 ? <Boton c={c} texto={t.empezarEscuchar} icono="play" onPress={() => terminar(true)} /> : null}

        <View style={{ flexDirection: "row", justifyContent: "center", gap: 8 }}>
          {Array.from({ length: pasosTotales }, (_, i) => i).map((i) => (
            <View key={i} style={{ width: i === puntoActivo ? 22 : 8, height: 8, borderRadius: 4, backgroundColor: i === puntoActivo ? c.accent : "rgba(244,236,226,0.3)" }} />
          ))}
        </View>
      </Entrada>
    </View>
  );
}
