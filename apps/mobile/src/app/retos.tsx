import { localIsoDate } from "@audite/domain";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { ScrollView, Text, useWindowDimensions, View } from "react-native";
import { fechaCorta, modeloRetos, organizarRetos, ventanaDeReto, type TarjetaReto } from "../temporadas";
import { fonts } from "../theme";
import { tx } from "../textos";
import { useHuecoInferior } from "../ui/barra-flotante";
import { IconoCirculo, SUPERFICIE } from "../ui/Basicos";
import { Entrada } from "../ui/Entrada";
import { Icono } from "../ui/Icono";
import { ProgressBar } from "../ui/ProgressBar";
import { Pulsable } from "../ui/Pulsable";
import { CartelCelda, CartelHeroe, CartelRail, LineaDelAnio } from "../ui/RetoCard";
import { ScreenHeader } from "../ui/ScreenHeader";
import { useTema } from "../ui/tema";

export function chipDeReto(tarjeta: TarjetaReto, lang: "es" | "en") {
  const t = tx(lang);
  if (tarjeta.estado === "en-curso") return { texto: t.enCurso, activo: true };
  if (tarjeta.estado === "terminado") return { texto: t.terminado, activo: false };
  return { texto: `${t.empiezaEl} ${fechaCorta(ventanaDeReto(tarjeta.id).inicio, lang)}`, activo: false };
}

export default function Retos() {
  const { c, lang, library } = useTema();
  const t = tx(lang);
  const router = useRouter();
  const hueco = useHuecoInferior();
  const ventana = useWindowDimensions();
  const hoyIso = localIsoDate(new Date());
  const m = useMemo(
    () => modeloRetos({ lang, hoyIso, progress: library.progress, rangos: library.catalog.rangos }),
    [hoyIso, lang, library.catalog.rangos, library.progress],
  );
  const org = useMemo(() => organizarRetos(m.temporadas), [m.temporadas]);
  const p = m.principal;
  const abrir = (reto: TarjetaReto) => router.push(`/reto/${reto.id}`);
  const celda = Math.floor((ventana.width - 40 - 14) / 2);
  const comun = (reto: TarjetaReto) => ({ c, t, reto, chip: chipDeReto(reto, lang), hoyIso, onPress: () => abrir(reto) });

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ paddingBottom: 32 + hueco }} showsVerticalScrollIndicator={false}>
      <ScreenHeader c={c} titulo={t.tabRetos} />
      <View style={{ gap: 28, paddingTop: 8 }}>
        {org ? (
          <Entrada orden={0} style={{ paddingHorizontal: 20 }}>
            <CartelHeroe {...comun(org.heroe)} botonTexto={org.heroe.hechos > 0 ? t.continuar : t.unirme} />
          </Entrada>
        ) : null}

        <Entrada orden={1} style={{ gap: 12 }}>
          <Text accessibilityRole="header" style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 20, paddingHorizontal: 20 }}>{t.temporadas}</Text>
          <LineaDelAnio c={c} t={t} lang={lang} hoyIso={hoyIso} vista={ventana.width} />
        </Entrada>

        {org && org.siguientes.length > 0 ? (
          <Entrada orden={2} style={{ gap: 12 }}>
            <Text accessibilityRole="header" style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 20, paddingHorizontal: 20 }}>{t.siguientes}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} decelerationRate="fast" snapToInterval={156 + 14} snapToAlignment="start" contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}>
              {org.siguientes.map((reto) => (
                <CartelRail key={reto.id} {...comun(reto)} />
              ))}
            </ScrollView>
          </Entrada>
        ) : null}

        {org && org.resto.length > 0 ? (
          <Entrada orden={3} style={{ gap: 12, paddingHorizontal: 20 }}>
            <Text accessibilityRole="header" style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 20 }}>{t.todosRetos}</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: 14, rowGap: 20 }}>
              {org.resto.map((reto) => (
                <CartelCelda key={reto.id} {...comun(reto)} ancho={celda} />
              ))}
            </View>
          </Entrada>
        ) : null}

        <Entrada orden={4} style={{ paddingHorizontal: 20 }}>
          <Pulsable onPress={() => router.navigate("/camino")} label={`${t.bibliaEntera}. ${p.hechos} ${t.de} ${p.total}`} haptica style={{ minHeight: 72, borderRadius: SUPERFICIE.radioFila, padding: 16, gap: 12, backgroundColor: c.card }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <IconoCirculo c={c} nombre="caminos" size={40} />
              <Text style={{ flex: 1, color: c.ink, fontFamily: fonts.serif, fontSize: 20 }}>{t.bibliaEntera}</Text>
              <Text style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 14 }}>{p.hechos} {t.de} {p.total}</Text>
              <Icono nombre="chevron" size={18} color={c.muted} />
            </View>
            <ProgressBar fraccion={p.fraccion} color={c.accent} pista={c.line} alto={4} />
          </Pulsable>
        </Entrada>
      </View>
    </ScrollView>
  );
}
