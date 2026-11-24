import { MENSAJES_LIBROS, rotuloCapitulo, type LibroFicha } from "@audite/domain";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { clienteLibrosApp } from "../../libros/cliente";
import { Cubierta } from "../../libros/cubierta";
import { LETRA } from "../../libros/estilos";
import { useColoresLibros } from "../../libros/tema";
import { mockDeDesarrollo } from "../../libros/config";
import { ui } from "../../theme";

export default function FichaLibro() {
  const { slug, mock } = useLocalSearchParams<{ slug: string; mock?: string }>();
  const colors = useColoresLibros();
  const router = useRouter();
  const [ficha, setFicha] = useState<LibroFicha | null | undefined>(undefined);
  useEffect(() => {
    let vivo = true;
    void clienteLibrosApp(mockDeDesarrollo(mock), null).then(({ api }) => api.libro(String(slug))).then((dato) => {
      if (vivo) setFicha(dato?.ficha ?? null);
    });
    return () => {
      vivo = false;
    };
  }, [slug, mock]);
  if (ficha === undefined) return <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: "center" }}><ActivityIndicator color={colors.accent} /></View>;
  if (ficha === null) return <View style={{ flex: 1, backgroundColor: colors.bg, padding: 22 }}><Text style={[ui.body, { color: colors.muted }]}>Este libro no está disponible ahora.</Text></View>;
  const lectura = ficha.disponibilidad === "lectura";
  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: 22, paddingBottom: 120, gap: 18 }}>
      <View style={{ alignItems: "center" }}><Cubierta volumen={ficha.volumen} titulo={ficha.titulo} ancho={150} /></View>
      <Text accessibilityRole="header" style={{ color: colors.ink, fontFamily: LETRA, fontSize: 36, lineHeight: 40 }}>{ficha.titulo}</Text>
      <Text style={[ui.body, { color: colors.muted, fontSize: 18 }]}>{ficha.subtitulo}</Text>
      {lectura ? (
        <View style={{ gap: 8 }}>
          <Pressable accessibilityRole="button" onPress={() => router.push(`/libros/${ficha.slug}/leer${mock ? `?mock=${mock}` : ""}` as never)} style={[ui.button, { backgroundColor: colors.accent }]}>
            <Text style={[ui.buttonText, { color: colors.accentInk }]}>Leer el adelanto</Text>
          </Pressable>
          <Text style={[ui.body, { color: colors.muted, fontSize: 14 }]}>El prólogo es gratis. El libro entero está incluido en la suscripción de Audite.</Text>
        </View>
      ) : (
        <Text style={[ui.body, { color: colors.ink, padding: 14, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card }]}>{MENSAJES_LIBROS.preparandose}</Text>
      )}
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: true }} disabled style={{ minHeight: 48, borderRadius: 999, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 18, justifyContent: "center", opacity: 0.7 }}>
        <Text style={{ color: colors.muted }}>Audiolibro · {MENSAJES_LIBROS.audiolibro}</Text>
      </Pressable>
      {ficha.amazon_paperback_url ? (
        <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(ficha.amazon_paperback_url as string)} style={{ minHeight: 48, borderRadius: 999, borderWidth: 1, borderColor: colors.accent, paddingHorizontal: 18, justifyContent: "center", alignSelf: "flex-start" }}>
          <Text style={{ color: colors.accent }}>Comprar en papel</Text>
        </Pressable>
      ) : null}
      <Text accessibilityRole="header" style={{ color: colors.ink, fontFamily: LETRA, fontSize: 26, marginTop: 12 }}>Índice</Text>
      {ficha.indice.map((entrada) => (
        <Pressable key={entrada.id} disabled={!lectura} onPress={() => router.push(`/libros/${ficha.slug}/leer?c=${entrada.id}${mock ? `&mock=${mock}` : ""}` as never)} style={{ minHeight: 52, justifyContent: "center", borderBottomWidth: 1, borderBottomColor: colors.line }}>
          <Text style={{ color: colors.muted, fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase" }}>{rotuloCapitulo(entrada)}{lectura && entrada.es_adelanto ? " · gratis" : ""}</Text>
          <Text style={{ color: colors.ink, fontFamily: LETRA, fontSize: 18 }}>{entrada.titulo}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
