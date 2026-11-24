import { altCubierta } from "@audite/domain";
import { useState } from "react";
import { Image, View } from "react-native";
import { baseContenido } from "./config";
import { Cubierta } from "./cubierta";
import { urlCubierta } from "./estanteria-datos";

/**
 * Portada real del volumen (2:3, esquinas leves y sombra). Mientras carga o si falla, queda debajo la
 * cubierta tipográfica, así la tarjeta nunca se ve vacía.
 */
export function PortadaLibro({ volumen, titulo, ancho = 72 }: { volumen: number; titulo: string; ancho?: number }) {
  const [cargada, setCargada] = useState(false);
  const [fallo, setFallo] = useState(false);
  const alto = Math.round(ancho * 1.5);
  return (
    <View
      style={{ width: ancho, height: alto, borderRadius: 4, backgroundColor: "#2A241C", shadowColor: "#000", shadowOpacity: 0.28, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 }}
    >
      {!cargada || fallo ? <Cubierta volumen={volumen} titulo={titulo} ancho={ancho} /> : null}
      {!fallo ? (
        <Image
          source={{ uri: urlCubierta(baseContenido(), volumen) }}
          accessibilityLabel={altCubierta({ volumen, titulo })}
          onLoad={() => setCargada(true)}
          onError={() => setFallo(true)}
          resizeMode="cover"
          style={{ position: "absolute", top: 0, left: 0, width: ancho, height: alto, borderRadius: 4, opacity: cargada ? 1 : 0 }}
        />
      ) : null}
    </View>
  );
}
