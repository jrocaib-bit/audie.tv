import { MENSAJES_LIBROS, paletaFicha, rotuloCapitulo, type EntradaIndice } from "@audite/domain";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { HojaAudios, ROTULO_AUDIOS } from "../../libros/audios";
import { mockDeDesarrollo } from "../../libros/config";
import { useEstanteria, useLibro, volumenEnMemoria } from "../../libros/datos";
import { Bloque, usePulso } from "../../libros/esqueleto";
import { LETRA } from "../../libros/estilos";
import { PortadaLibro } from "../../libros/portada";
import { ui } from "../../theme";

const FONDO_NEUTRO = "#2E2924";

function EsqueletoIndice({ tinta }: { tinta: string }) {
  const pulso = usePulso();
  return (
    <View accessibilityLabel="Cargando el índice" accessibilityRole="progressbar" style={{ gap: 14, paddingTop: 6 }}>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={{ gap: 8, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: "rgba(127,127,127,0.25)" }}>
          <Bloque opacidad={pulso} estilo={{ height: 10, width: 90, borderRadius: 3, backgroundColor: tinta, opacity: 0.2 }} />
          <Bloque opacidad={pulso} estilo={{ height: 16, width: `${60 + ((i * 13) % 30)}%`, borderRadius: 3, backgroundColor: tinta }} />
        </View>
      ))}
    </View>
  );
}

/**
 * Ficha del libro. Abre al instante con lo que ya hay de la estantería (título, color, portada y sinopsis).
 * El índice y el adelanto llegan después, dentro de la propia pantalla.
 */
export default function FichaLibro() {
  const { slug: crudo, mock } = useLocalSearchParams<{ slug: string; mock?: string }>();
  const slug = String(crudo);
  const router = useRouter();
  const estanteria = useEstanteria();
  const volumen = estanteria.dato?.find((v) => v.id === slug) ?? volumenEnMemoria(slug);
  const libro = useLibro(slug);
  const ficha = libro.dato?.ficha ?? null;
  const [audios, setAudios] = useState(false);
  const paleta = useMemo(() => paletaFicha(volumen?.color ?? FONDO_NEUTRO), [volumen?.color]);
  const mockDev = mockDeDesarrollo(mock);
  const consulta = mockDev ? `mock=${mockDev}` : "";

  const titulo = volumen?.titulo ?? ficha?.titulo ?? "";
  const subtitulo = volumen?.subtitulo ?? ficha?.subtitulo ?? "";
  const numero = volumen?.volumen ?? ficha?.volumen ?? 0;
  const disponibilidad = volumen?.disponibilidad ?? ficha?.disponibilidad ?? null;
  const lectura = disponibilidad === "lectura";
  const noExiste = !volumen && !libro.cargando && !estanteria.cargando && !ficha;
  const cabecera = <Stack.Screen options={{ headerStyle: { backgroundColor: paleta.fondo }, headerTintColor: paleta.tinta, contentStyle: { backgroundColor: paleta.fondo } }} />;

  if (noExiste) {
    return (
      <View style={{ flex: 1, backgroundColor: FONDO_NEUTRO, padding: 22 }}>
        {cabecera}
        <Text style={[ui.body, { color: "#F4ECE2" }]}>Este libro no está disponible ahora.</Text>
      </View>
    );
  }

  const rotulo = volumen?.rotulo ?? "";
  const ir = (ruta: string) => router.push(`${ruta}${consulta ? `${ruta.includes("?") ? "&" : "?"}${consulta}` : ""}` as never);
  const entradas: EntradaIndice[] = ficha?.indice ?? [];
  const lineaSuave = "rgba(127,127,127,0.3)";

  return (
    <View style={{ flex: 1, backgroundColor: paleta.fondo }}>
      {cabecera}
      <ScrollView style={{ backgroundColor: paleta.fondo }} contentContainerStyle={{ padding: 22, paddingBottom: 120, gap: 18 }}>
        <View style={{ alignItems: "center", paddingTop: 4 }}>
          {numero > 0 ? <PortadaLibro volumen={numero} titulo={titulo} ancho={210} grande /> : <View style={{ width: 210, height: 315 }} />}
        </View>
        {rotulo ? <Text style={{ color: paleta.tinta, fontSize: 12, letterSpacing: 2, fontWeight: "600", textAlign: "center" }}>{rotulo}</Text> : null}
        <Text accessibilityRole="header" style={{ color: paleta.tinta, fontFamily: LETRA, fontSize: 34, lineHeight: 38, textAlign: "center" }}>{titulo}</Text>
        {subtitulo ? <Text style={{ color: paleta.tinta, fontSize: 17, lineHeight: 24, textAlign: "center", fontWeight: "600" }}>{subtitulo}</Text> : null}
        {volumen?.sinopsis ? <Text style={{ color: paleta.tinta, fontSize: 16, lineHeight: 25 }}>{volumen.sinopsis}</Text> : null}

        {lectura ? (
          <View style={{ gap: 8 }}>
            <Pressable accessibilityRole="button" onPress={() => ir(`/libros/${slug}/leer`)} style={[ui.button, { backgroundColor: paleta.tinta, alignSelf: "stretch" }]}>
              <Text style={[ui.buttonText, { color: paleta.tintaInversa, fontWeight: "600" }]}>Leer el adelanto</Text>
            </Pressable>
            <Text style={{ color: paleta.tinta, fontSize: 14, lineHeight: 20, textAlign: "center" }}>El prólogo es gratis. El libro entero está incluido en la suscripción de Audite.</Text>
          </View>
        ) : disponibilidad ? (
          <Text style={{ color: paleta.tinta, fontSize: 16, lineHeight: 24, padding: 14, borderWidth: 1, borderColor: paleta.tinta, borderRadius: 14 }}>{MENSAJES_LIBROS.preparandose}</Text>
        ) : null}

        {volumen ? (
          <Pressable accessibilityRole="button" accessibilityLabel={ROTULO_AUDIOS} onPress={() => setAudios(true)} style={{ minHeight: 48, borderRadius: 999, borderWidth: 2, borderColor: paleta.tinta, paddingHorizontal: 18, justifyContent: "center", alignItems: "center" }}>
            <Text style={{ color: paleta.tinta, fontSize: 16, fontWeight: "600" }}>{ROTULO_AUDIOS}</Text>
          </Pressable>
        ) : null}

        <Text style={{ color: paleta.tinta, fontSize: 14, textAlign: "center" }}>Audiolibro · {MENSAJES_LIBROS.audiolibro}</Text>
        {ficha?.amazon_paperback_url ? (
          <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(ficha.amazon_paperback_url as string)} style={{ minHeight: 48, borderRadius: 999, borderWidth: 1, borderColor: paleta.tinta, paddingHorizontal: 18, justifyContent: "center", alignSelf: "center" }}>
            <Text style={{ color: paleta.tinta }}>Comprar en papel</Text>
          </Pressable>
        ) : null}

        <Text accessibilityRole="header" style={{ color: paleta.tinta, fontFamily: LETRA, fontSize: 26, marginTop: 12 }}>Índice</Text>
        {entradas.length === 0 && libro.cargando ? <EsqueletoIndice tinta={paleta.tinta} /> : null}
        {entradas.length === 0 && !libro.cargando && disponibilidad ? <Text style={{ color: paleta.tinta, fontSize: 15 }}>El índice no se pudo cargar ahora.</Text> : null}
        {entradas.map((entrada) => (
          <Pressable key={entrada.id} accessibilityRole="button" disabled={!lectura} onPress={() => ir(`/libros/${slug}/leer?c=${entrada.id}`)} style={{ minHeight: 52, justifyContent: "center", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: lineaSuave }}>
            <Text style={{ color: paleta.tinta, fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase" }}>{rotuloCapitulo(entrada)}{lectura && entrada.es_adelanto ? " · gratis" : ""}</Text>
            <Text style={{ color: paleta.tinta, fontFamily: LETRA, fontSize: 18 }}>{entrada.titulo}</Text>
          </Pressable>
        ))}
      </ScrollView>
      {volumen ? (
        <HojaAudios
          visible={audios}
          onCerrar={() => setAudios(false)}
          libro={volumen.libro}
          libroId={ficha?.libro_id}
          destacados={volumen.episodios_destacados}
          fondo={paleta.fondo}
          tinta={paleta.tinta}
        />
      ) : null}
    </View>
  );
}
