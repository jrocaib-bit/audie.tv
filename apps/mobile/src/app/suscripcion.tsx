import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Linking, Platform, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { obraDeEpisodio, obraWebp } from "../../../../packages/content/src/obras-visibles";
import { etiquetaDeLanzamiento, eventosDePaywall, letraDeLanzamiento, pideSuscripcion } from "@audite/domain";
import { sesionApp } from "../auth";
import { IDS_APPLE, PURCHASES_ENABLED } from "../compras/config";
import { comprarNativo, leerTienda, restaurarNativo } from "../compras/storekit";
import { TIENDA_DEMO, URL_CONDICIONES, URL_PRIVACIDAD, lineasDePaywall, pedirCompra, restaurarCompras, textoRenovacion, type EntornoPrecio, type LineaPrecio } from "../compras/tienda";
import { medir } from "../medicion";
import { useMobileLibrary } from "../state";
import { fonts } from "../theme";
import { tx } from "../textos";
import { Boton, BotonRedondo } from "../ui/Basicos";
import { ObraMarco } from "../ui/ObraMarco";
import { Pulsable } from "../ui/Pulsable";
import { dark } from "../theme";

const noche = "#100E0C";
const crema = "#F4ECE2";
const oro = "#C9A96E";
const muted = "#B7AB9C";
const obraPortada = obraDeEpisodio("gn-15");
const PORTADA = obraPortada ? obraWebp(obraPortada) : "";

function entornoDe(): EntornoPrecio {
  if (Platform.OS === "web") return "web";
  if (__DEV__) return "dev";
  return "tienda";
}

export default function SuscripcionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const parametros = useLocalSearchParams<{ tienda?: string; reto?: string }>();
  const demo = parametros.tienda === "demo";
  const es = useMobileLibrary().settings.uiLocale !== "en";
  const reto = Array.isArray(parametros.reto) ? parametros.reto[0] : parametros.reto;
  const etiqueta = etiquetaDeLanzamiento(es ? "es" : "en");
  const letra = letraDeLanzamiento(es ? "es" : "en");
  const [plan, setPlan] = useState<LineaPrecio["plan"]>("anual");
  const [lineas, setLineas] = useState<LineaPrecio[]>(() => lineasDePaywall({
    entorno: demo ? "tienda" : entornoDe(),
    tienda: demo ? TIENDA_DEMO : null,
  }));
  const [aviso, setAviso] = useState("");
  const elegida = lineas.find((linea) => linea.plan === plan) ?? lineas[1] ?? lineas[0];

  useEffect(() => {
    if (demo || entornoDe() !== "tienda") return;
    let vivo = true;
    void leerTienda(IDS_APPLE).then((tienda) => {
      if (!vivo) return;
      setLineas(lineasDePaywall({ entorno: "tienda", tienda }));
    });
    return () => { vivo = false; };
  }, [demo]);

  useEffect(() => {
    if (eventosDePaywall(PURCHASES_ENABLED, "ver")) medir("paywall_view", { origen: "app" });
  }, []);

  function elegir(siguiente: LineaPrecio["plan"]) {
    setPlan(siguiente);
    if (eventosDePaywall(PURCHASES_ENABLED, "plan")) medir("plan_selected", { plan: siguiente });
  }

  async function comprar() {
    if (!elegida) return;
    const sesion = await sesionApp();
    const resultado = await pedirCompra(PURCHASES_ENABLED, elegida.id, {
      requestPurchase: async (id) => {
        if (!sesion) return;
        await comprarNativo(id, sesion.userId);
      },
    });
    if (eventosDePaywall(PURCHASES_ENABLED, "probar")) medir("trial_started", { plan: elegida.plan });
    if (resultado === "pedida" && eventosDePaywall(PURCHASES_ENABLED, "comprar")) medir("purchase_completed", { plan: elegida.plan });
    if (resultado === "pedida") setAviso(es ? "Pedido enviado." : "Request sent.");
  }

  async function restaurar() {
    const sesion = await sesionApp();
    const resultado = await restaurarCompras({ restaurar: restaurarNativo }, Date.now(), undefined, sesion?.userId ?? null);
    setAviso(resultado.derecho.activo ? (es ? "Restaurada." : "Restored.") : (es ? "No hay compras." : "No purchases."));
  }

  const prueba = elegida?.pruebaDias;
  const t = tx(es ? "es" : "en");
  const cta = prueba ? (es ? `Empieza ${prueba} días gratis` : `Start ${prueba} days free`) : (es ? "Suscribirme" : "Subscribe");
  if (!pideSuscripcion(reto)) {
    return (
      <View style={{ flex: 1, backgroundColor: noche, paddingHorizontal: 22, paddingTop: insets.top + 12 }}>
        <BotonRedondo c={dark} nombre="cerrar" label={t.cerrar} onPress={() => router.back()} />
        <Text style={{ color: crema, fontFamily: fonts.serif, fontSize: 40, lineHeight: 44, marginTop: 24 }}>{es ? "Este reto es gratis." : "This challenge is free."}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: noche }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <View>
          <ObraMarco src={PORTADA} style={{ height: 300 + insets.top }} />
          <LinearGradient colors={["rgba(16,14,12,0.45)", "transparent", noche]} locations={[0, 0.4, 1]} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} pointerEvents="none" />
          <View style={{ position: "absolute", top: insets.top + 8, left: 16 }}>
            <BotonRedondo c={dark} nombre="cerrar" label={t.cerrar} onPress={() => router.back()} />
          </View>
        </View>
        <View style={{ paddingHorizontal: 22, gap: 16, marginTop: -28 }}>
          <View style={{ gap: 6 }}>
            <Text style={{ color: oro, fontFamily: fonts.medium, fontSize: 12, letterSpacing: 2, textTransform: "uppercase" }}>Audite Premium</Text>
            <Text style={{ color: crema, fontFamily: fonts.serif, fontSize: 40, lineHeight: 44 }}>{es ? "La Biblia, de principio a fin." : "The Bible, from beginning to end."}</Text>
          </View>
          <View style={{ gap: 10 }}>
            {[...lineas].sort((a) => (a.plan === "anual" ? -1 : 1)).map((linea) => {
              const activo = linea.plan === plan;
              const anual = linea.plan === "anual";
              const periodo = anual ? (es ? "año" : "year") : (es ? "mes" : "month");
              return (
                <Pulsable key={linea.id} label={`${anual ? t.anual : t.mensual} ${linea.precio}/${periodo}`} selected={activo} haptica onPress={() => elegir(linea.plan)} style={{ borderWidth: 1.5, borderColor: activo ? oro : "#2E2924", borderRadius: 22, padding: 18, backgroundColor: activo ? "rgba(224,196,138,0.1)" : "#1B1815", gap: 4 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: activo ? oro : muted, alignItems: "center", justifyContent: "center" }}>
                        {activo ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: oro }} /> : null}
                      </View>
                      <Text style={{ color: crema, fontFamily: fonts.medium, fontSize: 17, fontWeight: "600" }}>{anual ? t.anual : t.mensual}</Text>
                    </View>
                    <Text style={{ color: crema, fontFamily: fonts.serif, fontSize: anual ? 30 : 24 }}>{linea.precio ? `${linea.precio}/${periodo}` : "—"}</Text>
                  </View>
                  {anual && linea.pruebaDias ? (
                    <View style={{ alignSelf: "flex-start", marginTop: 6, paddingHorizontal: 10, minHeight: 26, borderRadius: 13, backgroundColor: oro, justifyContent: "center" }}>
                      <Text style={{ color: noche, fontFamily: fonts.medium, fontSize: 12, fontWeight: "700" }}>{es ? `${linea.pruebaDias} días gratis` : `${linea.pruebaDias} days free`}</Text>
                    </View>
                  ) : null}
                  {anual && etiqueta ? <Text style={{ color: oro, fontSize: 13, marginTop: 4 }}>{etiqueta}</Text> : null}
                  {anual && letra ? <Text style={{ color: muted, fontSize: 13 }}>{letra}</Text> : null}
                </Pulsable>
              );
            })}
          </View>
        </View>
      </ScrollView>
      <View style={{ paddingHorizontal: 22, paddingBottom: insets.bottom + 12, paddingTop: 8, gap: 4, backgroundColor: noche }}>
        {aviso ? <Text style={{ color: muted, textAlign: "center" }}>{aviso}</Text> : null}
        <Boton c={dark} texto={cta} onPress={() => void comprar()} />
        {elegida ? <Text style={{ color: muted, fontSize: 12, lineHeight: 16, textAlign: "center", marginTop: 6 }}>{textoRenovacion(es ? "es" : "en", elegida.plan, elegida.precio)}</Text> : null}
        <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 20 }}>
          <Pulsable role="link" label={t.terminos} onPress={() => void Linking.openURL(URL_CONDICIONES)} style={{ minHeight: 44, justifyContent: "center" }}>
            <Text style={{ color: oro, fontSize: 13 }}>{t.terminos}</Text>
          </Pulsable>
          <Pulsable role="link" label={t.privacidad} onPress={() => void Linking.openURL(URL_PRIVACIDAD)} style={{ minHeight: 44, justifyContent: "center" }}>
            <Text style={{ color: oro, fontSize: 13 }}>{t.privacidad}</Text>
          </Pulsable>
          <Pulsable label={t.restaurar} onPress={() => void restaurar()} style={{ minHeight: 44, justifyContent: "center" }}>
            <Text style={{ color: crema, fontSize: 13 }}>{t.restaurar}</Text>
          </Pulsable>
        </View>
      </View>
    </View>
  );
}
