import { MENSAJES_LIBROS, type LibroFicha, type VolumenEstanteria } from "@audite/domain";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { mockDeDesarrollo } from "../libros/config";
import { precargarCubierta, precargarLibro, precargarLomo, useCatalogo, useEstanteria } from "../libros/datos";
import { COLOR_ESTANTE, ALTO_LOMO, ANCHO_LOMO, EstanteriaApp } from "../libros/estanteria";
import { EsqueletoEstanteria, EsqueletoTarjeta } from "../libros/esqueleto";
import { LETRA } from "../libros/estilos";
import { PortadaLibro } from "../libros/portada";
import { SUBTITULO_LIBROS, TITULO_LIBROS } from "../libros/textos";
import { useColoresLibros } from "../libros/tema";
import { ui } from "../theme";
import { SUPERFICIE } from "../ui/Basicos";
import { useHuecoInferior } from "../ui/barra-flotante";

/** Lo mínimo de una tarjeta. Sale de la estantería (14 KB) y, si no hay estantería, del catálogo. */
type Fila = { id: string; slug: string; volumen: number; titulo: string; subtitulo: string; disponibilidad: LibroFicha["disponibilidad"] };

const deEstanteria = (v: VolumenEstanteria): Fila => ({ id: v.id, slug: v.id, volumen: v.volumen, titulo: v.titulo, subtitulo: v.subtitulo, disponibilidad: v.disponibilidad });

export default function Libros() {
  const colors = useColoresLibros();
  const insets = useSafeAreaInsets();
  const hueco = useHuecoInferior();
  const router = useRouter();
  const { mock } = useLocalSearchParams<{ mock?: string }>();
  const estanteria = useEstanteria();
  // El catálogo (73 KB) solo se pide si la estantería no está. Con estantería no hace falta esperar a nada más.
  const catalogo = useCatalogo(!estanteria.cargando && estanteria.dato === null);
  const volumenes = estanteria.dato;

  useEffect(() => {
    volumenes?.forEach((v) => precargarLomo(v.volumen));
  }, [volumenes]);

  const base: Fila[] = volumenes ? volumenes.map(deEstanteria) : (catalogo.dato ?? []).map((l) => ({ id: l.id, slug: l.slug, volumen: l.volumen, titulo: l.titulo, subtitulo: l.subtitulo, disponibilidad: l.disponibilidad }));
  const listos = base.filter((f) => f.disponibilidad !== "borrador");
  const enPreparacion = base.filter((f) => f.disponibilidad === "borrador");
  const filas = [...listos, ...enPreparacion];
  const cargando = estanteria.cargando || (volumenes === null && catalogo.cargando);

  return (
    <FlatList
      data={filas}
      keyExtractor={(f) => f.id}
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: 32 + hueco }}
      ListHeaderComponent={
        <View style={{ paddingHorizontal: 22, paddingTop: insets.top + 12, paddingBottom: 12, gap: 12 }}>
          <Text style={[ui.kicker, { color: colors.muted }]}>Libros</Text>
          <Text accessibilityRole="header" style={{ color: colors.ink, fontFamily: LETRA, fontSize: 38, lineHeight: 42 }}>{TITULO_LIBROS}</Text>
          <Text style={[ui.body, { color: colors.muted }]}>{SUBTITULO_LIBROS}</Text>
          {volumenes ? <EstanteriaApp volumenes={volumenes} mock={mockDeDesarrollo(mock)} /> : null}
          {cargando && !volumenes ? <EsqueletoEstanteria ancho={ANCHO_LOMO} alto={ALTO_LOMO} barra={COLOR_ESTANTE} /> : null}
          {!cargando && filas.length === 0 ? <Text style={[ui.body, { color: colors.muted }]}>El catálogo de libros se está preparando.</Text> : null}
        </View>
      }
      ListEmptyComponent={cargando ? <View><EsqueletoTarjeta fondo={colors.card} borde={colors.line} /><EsqueletoTarjeta fondo={colors.card} borde={colors.line} /><EsqueletoTarjeta fondo={colors.card} borde={colors.line} /></View> : undefined}
      renderItem={({ item, index }) => {
        const borrador = item.disponibilidad === "borrador";
        const primeraPreparacion = borrador && index === listos.length;
        return (
          <View>
            {primeraPreparacion ? <Text accessibilityRole="header" style={{ color: colors.ink, fontFamily: LETRA, fontSize: 24, marginHorizontal: 22, marginTop: 24, marginBottom: 8 }}>{MENSAJES_LIBROS.enPreparacion}</Text> : null}
            <Pressable
              accessibilityRole={borrador ? "text" : "link"}
              disabled={borrador}
              onPressIn={() => {
                precargarLibro(item.slug);
                precargarCubierta(item.volumen);
              }}
              onPress={() => router.push(`/libros/${item.slug}` as never)}
              style={{ flexDirection: "row", gap: 16, marginHorizontal: 20, marginBottom: 12, padding: 14, borderRadius: SUPERFICIE.radioFila, backgroundColor: colors.card, opacity: borrador ? 0.7 : 1, minHeight: 64 }}
            >
              <PortadaLibro volumen={item.volumen} titulo={item.titulo} ancho={72} />
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
