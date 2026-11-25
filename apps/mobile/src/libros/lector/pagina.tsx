import { PRECIO, rotuloCapitulo, type AnotacionesLibro, type CapituloLibro, type VistaLector } from "@audite/domain";
import { memo } from "react";
import { Pressable, Text, View, type GestureResponderEvent } from "react-native";
import { Bloque, usePulso } from "../esqueleto";
import { LETRA } from "../estilos";
import { llevaSangria, metricas } from "../lector-estilo";
import { tintaSobreAcento, type ColoresLector } from "../lector-temas";
import type { ItemLector } from "./items";
import { TextoBloque, type SeleccionLector } from "./texto";

export type PropsPagina = {
  item: ItemLector;
  capitulo: CapituloLibro | undefined;
  ancho: number;
  alto: number;
  margen: number;
  superior: number;
  inferior: number;
  tamano: number;
  tema: ColoresLector;
  acento: string;
  subrayados: AnotacionesLibro["subrayados"];
  marcadores: AnotacionesLibro["marcadores"];
  seleccion: SeleccionLector;
  vista: VistaLector;
  episodioOible?: string;
  alToque: (pageX: number) => void;
  alMantener: (bloqueId: string, pos: number, subrayado: string | null) => void;
  alAbrirEpisodio: () => void;
  alSuscribir: () => void;
  alEntrar: () => void;
};

export function CabeceraCapitulo({ capitulo, tamano, tema, acento }: { capitulo: CapituloLibro; tamano: number; tema: ColoresLector; acento: string }) {
  const { fsTitulo, lhTitulo, lhRotulo } = metricas(tamano);
  return (
    <View>
      <Text style={{ color: acento, fontSize: 12, lineHeight: lhRotulo, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>{rotuloCapitulo(capitulo)}</Text>
      <Text accessibilityRole="header" style={{ color: tema.ink, fontFamily: LETRA, fontSize: fsTitulo, lineHeight: lhTitulo }}>{capitulo.titulo}</Text>
      <View style={{ height: 28 }} />
    </View>
  );
}

export function TarjetaCorte({ tema, acento, vista, alSuscribir, alEntrar }: { tema: ColoresLector; acento: string; vista: VistaLector; alSuscribir: () => void; alEntrar: () => void }) {
  const boton = { minHeight: 48, borderRadius: 999, paddingHorizontal: 18, alignItems: "center" as const, justifyContent: "center" as const };
  return (
    <View accessibilityLabel="El libro sigue aquí" style={{ padding: 22, borderRadius: 24, borderWidth: 1, borderColor: tema.line, backgroundColor: tema.card, gap: 10 }}>
      <Text style={{ color: acento, fontSize: 12, letterSpacing: 2, textTransform: "uppercase" }}>Audite Premium</Text>
      <Text accessibilityRole="header" style={{ color: tema.ink, fontFamily: LETRA, fontSize: 30 }}>El libro sigue aquí</Text>
      <Text style={{ color: tema.muted, fontSize: 16, lineHeight: 24 }}>
        {vista === "gratuito"
          ? "Tu cuenta ya está creada. Con la suscripción, el libro entero se abre y tus notas lo acompañan."
          : "El resto del libro se abre con la suscripción de Audite. Prueba 7 días gratis y sigue leyendo donde lo dejaste."}
      </Text>
      <Text style={{ color: tema.muted, fontSize: 13 }}>Después, {PRECIO.anio} al año o {PRECIO.mes} al mes.</Text>
      <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
        <Pressable accessibilityRole="button" onPress={alSuscribir} style={[boton, { backgroundColor: acento }]}>
          <Text style={{ color: tintaSobreAcento(acento), fontSize: 16, fontWeight: "600" }}>Prueba {PRECIO.pruebaDias} días gratis</Text>
        </Pressable>
        {vista === "sin-sesion" ? (
          <Pressable accessibilityRole="button" onPress={alEntrar} style={[boton, { borderWidth: 1, borderColor: tema.line }]}>
            <Text style={{ color: tema.ink, fontSize: 16 }}>Entrar</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function LineasEspera({ tema }: { tema: ColoresLector }) {
  const pulso = usePulso();
  return (
    <View accessibilityRole="progressbar" accessibilityLabel="Cargando el capítulo" style={{ gap: 14, paddingTop: 8 }}>
      <Bloque opacidad={pulso} estilo={{ height: 22, width: "55%", borderRadius: 4, backgroundColor: tema.line }} />
      {Array.from({ length: 9 }, (_, i) => (
        <Bloque key={i} opacidad={pulso} estilo={{ height: 12, width: i % 4 === 3 ? "62%" : "100%", borderRadius: 4, backgroundColor: tema.line }} />
      ))}
    </View>
  );
}

/** Una página del libro: el tamaño de la pantalla y el texto dentro de sus márgenes. */
export const PaginaLector = memo(function PaginaLector(p: PropsPagina) {
  const { item, capitulo, tema } = p;
  const { lh } = metricas(p.tamano);
  const marco = { width: p.ancho, height: p.alto, paddingTop: p.superior, paddingBottom: p.inferior, paddingHorizontal: p.margen };
  const zona = (e: GestureResponderEvent) => p.alToque(e.nativeEvent.pageX);

  if (item.tipo === "corte") {
    return (
      <View style={[marco, { justifyContent: "center" }]}>
        <TarjetaCorte tema={tema} acento={p.acento} vista={p.vista} alSuscribir={p.alSuscribir} alEntrar={p.alEntrar} />
      </View>
    );
  }
  if (item.tipo === "cargando" || !capitulo) {
    return (
      <Pressable onPress={zona} style={marco}>
        <LineasEspera tema={tema} />
      </Pressable>
    );
  }
  return (
    <Pressable accessible={false} onPress={zona} style={marco}>
      <View style={{ flex: 1, overflow: "hidden" }}>
        {item.fragmentos.map((f, k) => {
          if (f.bloque === 0) return <CabeceraCapitulo key="cabecera" capitulo={capitulo} tamano={p.tamano} tema={tema} acento={p.acento} />;
          const bloque = capitulo.bloques[f.bloque - 1];
          const medible = item.medibles[f.bloque];
          if (!bloque || !medible) return null;
          const completo = f.desde === 0 && f.hasta === medible.lineas;
          const contenido = (
            <TextoBloque
              bloque={bloque}
              tamano={p.tamano}
              tema={tema}
              acento={p.acento}
              sangria={llevaSangria(bloque, capitulo.bloques[f.bloque - 2])}
              subrayados={p.subrayados.filter((s) => s.bloque_id === bloque.id)}
              seleccion={p.seleccion}
              marcado={p.marcadores.some((m) => m.bloque_id === bloque.id)}
              justificado
              episodioOible={p.episodioOible}
              alToque={p.alToque}
              alMantener={(pos, sub) => p.alMantener(bloque.id, pos, sub)}
              alAbrirEpisodio={p.alAbrirEpisodio}
            />
          );
          return (
            <View key={`${f.bloque}-${f.desde}`} style={{ marginTop: k === 0 ? 0 : medible.antes }}>
              {completo ? contenido : (
                <View style={{ height: (f.hasta - f.desde) * lh, overflow: "hidden" }}>
                  <View style={{ marginTop: -f.desde * lh }}>{contenido}</View>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </Pressable>
  );
});
