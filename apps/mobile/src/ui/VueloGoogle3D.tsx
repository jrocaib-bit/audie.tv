import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import { leerMensajeVuelo, scriptInyeccionVuelo, type MensajeVuelo, type PlanVuelo } from "../sala-vuelo";
import { HTML_VUELO } from "../sala-vuelo-html";

type Props = {
  plan: PlanVuelo;
  /** Clave de Map Tiles API (EXPO_PUBLIC_GOOGLE_MAPS_API_KEY). Solo en memoria: no se registra ni se guarda. */
  clave: string;
  onMensaje: (m: MensajeVuelo) => void;
};

/**
 * Vuelo en vivo (Google Photorealistic 3D Tiles + CesiumJS) en una WebView sin interacción.
 * El HTML empaquetado no lleva clave: se inyecta antes de cargar la página. Sin caché ni almacenamiento
 * persistente (las teselas de Google no se guardan). El logo de Google y las atribuciones los dibuja la propia página
 * y quedan siempre visibles; nada de la interfaz nativa debe taparlos.
 */
export function VueloGoogle3D({ plan, clave, onMensaje }: Props) {
  const inyeccion = useMemo(() => scriptInyeccionVuelo(clave, plan), [clave, plan]);
  const alMensaje = (e: WebViewMessageEvent) => {
    const m = leerMensajeVuelo(e.nativeEvent.data);
    if (m) onMensaje(m);
  };
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <WebView
        source={{ html: HTML_VUELO, baseUrl: "https://audite.tv/" }}
        injectedJavaScriptBeforeContentLoaded={inyeccion}
        onMessage={alMensaje}
        onError={() => onMensaje({ tipo: "error", motivo: "webview" })}
        onHttpError={() => onMensaje({ tipo: "error", motivo: "http" })}
        onRenderProcessGone={() => onMensaje({ tipo: "error", motivo: "proceso" })}
        onContentProcessDidTerminate={() => onMensaje({ tipo: "error", motivo: "proceso" })}
        originWhitelist={["https://*", "about:*"]}
        onShouldStartLoadWithRequest={(r) => r.url === "about:blank" || r.url.startsWith("https://audite.tv/") || r.url.startsWith("data:")}
        javaScriptEnabled
        domStorageEnabled={false}
        incognito
        cacheEnabled={false}
        cacheMode="LOAD_NO_CACHE"
        androidLayerType="hardware"
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        setSupportMultipleWindows={false}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        style={{ flex: 1, backgroundColor: "#020205" }}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
    </View>
  );
}
