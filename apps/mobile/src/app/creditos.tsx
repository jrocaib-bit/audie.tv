import { creditoVisible, idiomaContenido, t as msg } from "@audite/domain";
import { useMemo } from "react";
import { FlatList, Text, View } from "react-native";
import { obraEnPantalla, obrasVisibles } from "../../../../packages/content/src/obras-visibles";
import { CREDITOS_EDIFICIOS, CREDITOS_LUGARES } from "../sala-assets";
import { fonts } from "../theme";
import { tx } from "../textos";
import { useTema } from "../ui/tema";

/** Texto bíblico y obras. Discreto: solo aquí se muestran las atribuciones. */
export default function Creditos() {
  const { c, lang, library } = useTema();
  const t = tx(lang);
  const locale = library.settings.uiLocale;
  const fuente = creditoVisible(library.catalog.fuenteTexto[idiomaContenido(locale)], msg(locale, "sourceLabel"), msg(locale, "sourcePending"));
  const obras = useMemo(() => obrasVisibles().filter((obra) => obraEnPantalla(obra.episodio)), []);
  return (
    <FlatList
      data={obras}
      keyExtractor={(obra) => obra.id}
      style={{ backgroundColor: c.bg }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48 }}
      initialNumToRender={14}
      windowSize={7}
      ListHeaderComponent={
        <View style={{ gap: 20, paddingBottom: 16 }}>
          <Text accessibilityRole="header" style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 34, lineHeight: 40 }}>{t.creditos}</Text>
          <View style={{ gap: 6 }}>
            <Text style={{ color: c.muted, fontFamily: fonts.medium, fontSize: 13, letterSpacing: 1, textTransform: "uppercase" }}>{t.textoBiblico}</Text>
            <Text style={{ color: c.ink, fontFamily: fonts.sans, fontSize: 14, lineHeight: 20 }}>{fuente}</Text>
          </View>
          <Text style={{ color: c.muted, fontFamily: fonts.medium, fontSize: 13, letterSpacing: 1, textTransform: "uppercase" }}>{t.obras}</Text>
        </View>
      }
      ListFooterComponent={
        <View style={{ gap: 10, paddingTop: 24 }}>
          <Text style={{ color: c.muted, fontFamily: fonts.medium, fontSize: 13, letterSpacing: 1, textTransform: "uppercase" }}>{t.lugaresSala}</Text>
          {CREDITOS_LUGARES.map((item) => (
            <View key={item.titulo} style={{ paddingVertical: 8, borderTopWidth: 1, borderTopColor: c.line }}>
              <Text style={{ color: c.ink, fontFamily: fonts.sans, fontSize: 13, lineHeight: 18 }}>{item.titulo}</Text>
              <Text style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 12, lineHeight: 16 }}>{item.detalle}</Text>
              <Text style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 12, lineHeight: 16 }}>{item.licencia}</Text>
            </View>
          ))}
          {CREDITOS_EDIFICIOS.map((item) => (
            <View key={item.titulo} style={{ paddingVertical: 8, borderTopWidth: 1, borderTopColor: c.line }}>
              <Text style={{ color: c.ink, fontFamily: fonts.sans, fontSize: 13, lineHeight: 18 }}>{item.titulo}</Text>
              <Text style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 12, lineHeight: 16 }}>
                {item.autor} · {item.licencia} · Wikimedia Commons (recortada y comprimida)
              </Text>
              <Text selectable style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 11, lineHeight: 15 }}>{item.url}</Text>
            </View>
          ))}
        </View>
      }
      renderItem={({ item }) => (
        <View style={{ paddingVertical: 8, borderTopWidth: 1, borderTopColor: c.line }}>
          <Text style={{ color: c.ink, fontFamily: fonts.sans, fontSize: 13, lineHeight: 18 }}>{item.placa[lang]}</Text>
          <Text style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 12, lineHeight: 16 }}>{item.licencia}</Text>
        </View>
      )}
    />
  );
}
