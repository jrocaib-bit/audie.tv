import { aplicarSubrayados, trozosDeHtml, type AnotacionesLibro, type BloqueLibro } from "@audite/domain";
import { memo, useMemo, type ReactNode } from "react";
import { Platform, Text, View, type GestureResponderEvent, type TextStyle } from "react-native";
import { LETRA } from "../estilos";
import { partirEnFrases } from "../frases";
import { SANGRIA, metricas } from "../lector-estilo";
import type { ColoresLector } from "../lector-temas";
import { fondoSubrayado } from "../subrayado";

export type SeleccionLector = { bloque: string; inicio: number; fin: number } | null;

type Props = {
  bloque: BloqueLibro;
  tamano: number;
  tema: ColoresLector;
  acento: string;
  /** Párrafo que sigue a otro párrafo: lleva sangría de primera línea. */
  sangria: boolean;
  subrayados: AnotacionesLibro["subrayados"];
  seleccion: SeleccionLector;
  marcado: boolean;
  justificado: boolean;
  episodioOible?: string;
  /** Un toque en el texto. Lleva la posición horizontal para decidir página anterior, siguiente o menú. */
  alToque?: (pageX: number) => void;
  alMantener?: (pos: number, subrayado: string | null) => void;
  alAbrirEpisodio?: () => void;
  /** Medición: se llama con el número de líneas que ocupa el bloque. */
  alMedir?: (lineas: number) => void;
};

const ID_SELECCION = "__seleccion";
// Propiedades que solo existen en web y en cada plataforma. Se aplican sin tocar el tipo de estilo de RN.
const GUIONES_WEB = (Platform.OS === "web" ? { hyphens: "auto", wordBreak: "normal", overflowWrap: "break-word" } : {}) as TextStyle;

/** Estilo de texto de un bloque. Lo comparten la lectura y la medición, para que las líneas coincidan. */
export function estiloTexto(bloque: BloqueLibro, tamano: number, tema: ColoresLector, justificado: boolean): TextStyle {
  const { lh } = metricas(tamano);
  return {
    fontFamily: LETRA,
    fontSize: bloque.tipo === "pasaje" ? Math.round(tamano * 0.95) : bloque.tipo === "subtitulo" ? Math.round(tamano * 1.08) : tamano,
    lineHeight: lh,
    color: bloque.tipo === "pasaje" ? tema.muted : tema.ink,
    textAlign: justificado && bloque.tipo !== "subtitulo" ? "justify" : "left",
    ...(bloque.tipo === "subtitulo" ? { fontWeight: "700" } : null),
    ...GUIONES_WEB,
  };
}

/** Texto de un bloque con em, strong, referencias, subrayados de color y selección. */
export const TextoBloque = memo(function TextoBloque({ bloque, tamano, tema, acento, sangria, subrayados, seleccion, marcado, justificado, episodioOible, alToque, alMantener, alAbrirEpisodio, alMedir }: Props) {
  const trozos = useMemo(() => trozosDeHtml(bloque.html), [bloque.html]);
  const colorDe = useMemo(() => new Map(subrayados.map((s) => [s.id, s.color])), [subrayados]);
  const rangos = useMemo(() => {
    const lista = subrayados.map((s) => ({ id: s.id, inicio: s.inicio, fin: s.fin }));
    if (seleccion && seleccion.bloque === bloque.id) lista.push({ id: ID_SELECCION, inicio: seleccion.inicio, fin: seleccion.fin });
    return lista;
  }, [subrayados, seleccion, bloque.id]);
  const pintados = useMemo(() => aplicarSubrayados(trozos, rangos), [trozos, rangos]);
  const base = estiloTexto(bloque, tamano, tema, justificado);

  const hijos: ReactNode[] = [];
  let posicion = 0;
  if (sangria) hijos.push(<Text key="sangria">{SANGRIA}</Text>);
  pintados.forEach((trozo, i) => {
    if (trozo.tipo === "br") {
      posicion += 1;
      hijos.push(<Text key={`br${i}`}>{"\n"}</Text>);
      return;
    }
    const ids = "subrayados" in trozo ? trozo.subrayados ?? [] : [];
    const propio = ids.find((id) => id !== ID_SELECCION) ?? null;
    const enSeleccion = ids.includes(ID_SELECCION);
    const fondo = enSeleccion ? (tema.oscuro ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.14)") : propio ? fondoSubrayado(colorDe.get(propio), tema.oscuro) : undefined;
    const estilo: TextStyle = {
      ...(fondo ? { backgroundColor: fondo } : null),
      ...(("em" in trozo && trozo.em) || bloque.tipo === "pasaje" ? { fontStyle: "italic" } : null),
      ...(trozo.tipo === "texto" && trozo.strong ? { fontWeight: "700" } : null),
    };
    const inicio = posicion;
    posicion += trozo.texto.length;
    if (trozo.tipo === "ref") {
      const abre = episodioOible === trozo.episodio;
      hijos.push(
        <Text key={i} onPress={abre ? alAbrirEpisodio : (e: GestureResponderEvent) => alToque?.(e.nativeEvent.pageX)} onLongPress={() => alMantener?.(inicio, propio)} accessibilityRole={abre ? "link" : undefined} style={[estilo, { color: acento, textDecorationLine: "underline" }]}>
          {trozo.texto}
        </Text>,
      );
      return;
    }
    for (const frase of partirEnFrases(trozo.texto)) {
      hijos.push(
        <Text key={`${i}-${frase.inicio}`} onPress={alToque ? (e: GestureResponderEvent) => alToque(e.nativeEvent.pageX) : undefined} onLongPress={alMantener ? () => alMantener(inicio + frase.inicio, propio) : undefined} style={estilo}>
          {frase.texto}
        </Text>,
      );
    }
  });

  return (
    <View style={marcado ? { borderLeftWidth: 3, borderLeftColor: acento, paddingLeft: 6, marginLeft: -9 } : undefined}>
      <Text
        accessibilityRole={bloque.tipo === "subtitulo" ? "header" : undefined}
        onTextLayout={alMedir ? (e) => alMedir(e.nativeEvent.lines.length) : undefined}
        // Guiones y reparto de líneas: Android los pide aquí; iOS y web usan su motor de texto.
        android_hyphenationFrequency="full"
        textBreakStrategy="highQuality"
        lineBreakStrategyIOS="standard"
        {...({ lang: "es" } as object)}
        style={base}
      >
        {hijos}
      </Text>
    </View>
  );
});
