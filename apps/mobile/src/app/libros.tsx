import { MENSAJES_LIBROS, type LibroFicha, type VolumenEstanteria } from "@audite/domain";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { clienteLibrosApp } from "../libros/cliente";
import { baseContenido, mockDeDesarrollo } from "../libros/config";
import { cargarEstanteriaApp } from "../libros/estanteria-datos";
import { EstanteriaApp } from "../libros/estanteria";
import { Cubierta } from "../libros/cubierta";
import { LETRA } from "../libros/estilos";
import { useColoresLibros } from "../libros/tema";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ui } from "../theme";

export default function Libros() {
  const colors = useColoresLibros();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [libros, setLibros] = useState<LibroFicha[] | null>(null);
  const [estanteria, setEstanteria] = useState<VolumenEstanteria[] | null>(null);
  const { mock } = useLocalSearchParams<{ mock?: string }>();
  useEffect(() => {
    let vivo = true;
    void cargarEstanteriaApp(baseContenido()).then((lista) => {
      if (vivo && lista) setEstanteria(lista);
    });
    void clienteLibrosApp(null, null).then(({ api }) => api.catalogo()).then((dato) => {
      if (vivo) setLibros(dato.libros);
    });
    return () => {
      vivo = false;
    };
  }, []);
  const listos = (libros ?? []).filter((libro) => libro.disponibilidad !== "borrador");
  const enPreparacion = (libros ?? []).filter((libro) => libro.disponibilidad === "borrador");
  const filas = [...listos, ...enPreparacion];
  return (
    <FlatList
      data={filas}
      keyExtractor={(libro) => libro.id}
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: 120 }}
      ListHeaderComponent={
        <View style={{ paddingHorizontal: 22, paddingTop: insets.top + 12, paddingBottom: 12, gap: 12 }}>
          <Text style={[ui.kicker, { color: colors.muted }]}>Libros</Text>
          <Text accessibilityRole="header" style={{ color: colors.ink, fontFamily: LETRA, fontSize: 38, lineHeight: 42 }}>La Escritura, leída con los Padres</Text>
          <Text style={[ui.body, { color: colors.muted }]}>Se leen aquí, con el prólogo gratis y el resto incluido en la suscripción.</Text>
          {estanteria ? <EstanteriaApp volumenes={estanteria} mock={mockDeDesarrollo(mock)} /> : null}
          {libros === null ? <ActivityIndicator color={colors.accent} /> : null}
          {libros !== null && libros.length === 0 ? <Text style={[ui.body, { color: colors.muted }]}>El catálogo de libros se está preparando.</Text> : null}
        </View>
      }
      renderItem={({ item, index }) => {
        const borrador = item.disponibilidad === "borrador";
        const primeraPreparacion = borrador && index === listos.length;
        return (
          <View>
            {primeraPreparacion ? <Text accessibilityRole="header" style={{ color: colors.ink, fontFamily: LETRA, fontSize: 24, marginHorizontal: 22, marginTop: 24, marginBottom: 8 }}>{MENSAJES_LIBROS.enPreparacion}</Text> : null}
            <Pressable
              accessibilityRole={borrador ? "text" : "link"}
              disabled={borrador}
              onPress={() => router.push(`/libros/${item.slug}` as never)}
              style={{ flexDirection: "row", gap: 16, marginHorizontal: 22, marginBottom: 14, padding: 14, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, opacity: borrador ? 0.7 : 1, minHeight: 64 }}
            >
              <Cubierta volumen={item.volumen} titulo={item.titulo} ancho={72} />
              <View style={{ flex: 1, gap: 4, justifyContent: "center" }}>
                <Text style={{ color: colors.ink, fontFamily: LETRA, fontSize: 22, lineHeight: 26 }}>{item.titulo}</Text>
                <Text style={[ui.body, { color: colors.muted, fontSize: 14, lineHeight: 20 }]}>{item.subtitulo}</Text>
                <Text style={{ color: borrador ? colors.muted : colors.accent, fontSize: 13 }}>
                  {borrador ? MENSAJES_LIBROS.enPreparacion : item.disponibilidad === "preparandose" ? "Lectura en preparación" : "Adelanto gratis"}
                </Text>
              </View>
            </Pressable>
          </View>
        );
      }}
    />
  );
}
