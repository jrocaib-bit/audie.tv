import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { etiquetaDeLanzamiento, eventosDePaywall, pideSuscripcion } from "@audite/domain";
import { sesionApp } from "../auth";
import { IDS_APPLE, PURCHASES_ENABLED } from "../compras/config";
import { comprarNativo, leerTienda, restaurarNativo } from "../compras/storekit";
import { TIENDA_DEMO, lineasDePaywall, pedirCompra, restaurarCompras, type EntornoPrecio, type LineaPrecio } from "../compras/tienda";
import { medir } from "../medicion";
import { useMobileLibrary } from "../state";
import { fonts } from "../theme";

const noche = "#100E0C";
const crema = "#F4ECE2";
const oro = "#C9A96E";
const muted = "#B7AB9C";

function entornoDe(): EntornoPrecio {
  if (Platform.OS === "web") return "web";
  if (__DEV__) return "dev";
  return "tienda";
}

export default function SuscripcionScreen() {
  const router = useRouter();
  const parametros = useLocalSearchParams<{ tienda?: string; reto?: string }>();
  const demo = parametros.tienda === "demo";
  const es = useMobileLibrary().settings.uiLocale !== "en";
  const reto = Array.isArray(parametros.reto) ? parametros.reto[0] : parametros.reto;
  const etiqueta = etiquetaDeLanzamiento(es ? "es" : "en");
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
  const cta = prueba ? (es ? `Empieza ${prueba} días gratis` : `Start ${prueba} days free`) : (es ? "Suscribirme" : "Subscribe");
  if (!pideSuscripcion(reto)) {
    return (
      <View style={{ flex: 1, backgroundColor: noche, paddingHorizontal: 22, paddingTop: 28 }}>
        <Pressable accessibilityRole="button" accessibilityLabel={es ? "Cerrar" : "Close"} onPress={() => router.back()} style={{ minHeight: 44, justifyContent: "center", alignSelf: "flex-start" }}>
          <Text style={{ color: crema, fontSize: 22 }}>↓</Text>
        </Pressable>
        <Text style={{ color: crema, fontFamily: fonts.serif, fontSize: 40, lineHeight: 44, marginTop: 24 }}>{es ? "Este reto es gratis." : "This challenge is free."}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: noche, paddingHorizontal: 22, paddingTop: 28, paddingBottom: 28 }}>
      <Pressable accessibilityRole="button" accessibilityLabel={es ? "Cerrar" : "Close"} onPress={() => router.back()} style={{ minHeight: 44, justifyContent: "center", alignSelf: "flex-start" }}>
        <Text style={{ color: crema, fontSize: 22 }}>↓</Text>
      </Pressable>
      <Text style={{ color: oro, fontFamily: fonts.sans, fontSize: 12, letterSpacing: 2, textTransform: "uppercase", marginTop: 12 }}>Audite Premium</Text>
      <Text style={{ color: crema, fontFamily: fonts.serif, fontSize: 44, lineHeight: 48, marginTop: 8 }}>{es ? "La Biblia,\nde principio\na fin." : "The Bible,\nfrom beginning\nto end."}</Text>
      <View style={{ marginTop: 28, gap: 12 }}>
        {lineas.map((linea) => {
          const activo = linea.plan === plan;
          const periodo = linea.plan === "anual" ? (es ? "año" : "year") : (es ? "mes" : "month");
          return (
            <Pressable key={linea.id} accessibilityRole="button" accessibilityState={{ selected: activo }} onPress={() => elegir(linea.plan)} style={{ borderWidth: 1, borderColor: activo ? oro : "#2E2924", borderRadius: 16, padding: 16, backgroundColor: "#1B1815" }}>
              <Text style={{ color: muted, fontSize: 14 }}>{linea.plan === "anual" ? (es ? "Anual" : "Yearly") : (es ? "Mensual" : "Monthly")}</Text>
              <Text style={{ color: crema, fontFamily: fonts.serif, fontSize: 36, lineHeight: 40, marginTop: 4 }}>{linea.precio ? `${linea.precio}/${periodo}` : "—"}</Text>
              {linea.plan === "anual" && etiqueta ? <Text style={{ color: oro, marginTop: 6 }}>{etiqueta}</Text> : null}
              {linea.pruebaDias ? <Text style={{ color: oro, marginTop: 6 }}>{es ? `${linea.pruebaDias} días gratis` : `${linea.pruebaDias} days free`}</Text> : null}
            </Pressable>
          );
        })}
      </View>
      <Text style={{ color: muted, marginTop: 16 }}>{es ? "Precio de lanzamiento hasta el 5 de enero. Desde el 6 de enero, 12,99 € al año para las suscripciones nuevas. El reto Adviento con Isaías es gratis y no hace falta suscripción." : "Launch price until 5 January. From 6 January, €12.99 a year for new annual subscriptions. Advent with Isaiah is free and does not need a subscription."}</Text>
      <View style={{ marginTop: "auto", gap: 12 }}>
        {aviso ? <Text style={{ color: muted, textAlign: "center" }}>{aviso}</Text> : null}
        <Pressable accessibilityRole="button" onPress={() => void comprar()} style={{ minHeight: 52, borderRadius: 999, backgroundColor: oro, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: noche, fontSize: 16 }}>{cta}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => void restaurar()} style={{ minHeight: 48, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: crema }}>{es ? "Restaurar compras" : "Restore purchases"}</Text>
        </Pressable>
      </View>
    </View>
  );
}
