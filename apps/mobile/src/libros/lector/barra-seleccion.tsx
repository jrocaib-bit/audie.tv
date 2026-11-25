import { NOTA_MAX } from "@audite/domain";
import { Pressable, Text, TextInput, View } from "react-native";
import { COLORES_SUBRAYADO, MUESTRA, ROTULO_COLOR, colorNormalizado, type ColorSubrayado } from "../subrayado";
import { tintaSobreAcento, type ColoresLector } from "../lector-temas";

type Props = {
  tema: ColoresLector;
  acento: string;
  /** Color del subrayado seleccionado, si lo hay. */
  colorActual: string | null;
  hayRango: boolean;
  marcado: boolean;
  notas: { id: string; texto: string }[];
  escribiendo: boolean;
  textoNota: string;
  inferior: number;
  alColor: (color: ColorSubrayado) => void;
  alQuitarSubrayado: () => void;
  alAmpliarBloque: () => void;
  alMarcar: () => void;
  alAnotar: () => void;
  alGuardarNota: () => void;
  alCancelarNota: () => void;
  alCambiarNota: (texto: string) => void;
  alBorrarNota: (id: string) => void;
  alCerrar: () => void;
};

/** Barra inferior de marcas: cuatro colores de subrayado, nota, marcador y quitar. */
export function BarraSeleccion(p: Props) {
  const t = p.tema;
  const boton = { minHeight: 44, minWidth: 44, borderRadius: 999, borderWidth: 1, borderColor: t.line, paddingHorizontal: 14, alignItems: "center" as const, justifyContent: "center" as const };
  const actual = p.colorActual ? colorNormalizado(p.colorActual) : null;
  return (
    <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, paddingTop: 12, paddingHorizontal: 14, paddingBottom: 12 + p.inferior, gap: 10, backgroundColor: t.card, borderTopWidth: 1, borderTopColor: t.line, borderTopLeftRadius: 18, borderTopRightRadius: 18 }}>
      {p.escribiendo ? (
        <>
          <TextInput value={p.textoNota} onChangeText={p.alCambiarNota} maxLength={NOTA_MAX} multiline autoFocus placeholder="Nota" placeholderTextColor={t.muted} style={{ minHeight: 72, color: t.ink, borderWidth: 1, borderColor: t.line, borderRadius: 12, padding: 12, fontSize: 16 }} />
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable accessibilityRole="button" style={[boton, { backgroundColor: p.acento, borderColor: p.acento }]} onPress={p.alGuardarNota}><Text style={{ color: tintaSobreAcento(p.acento), fontWeight: "600" }}>Guardar nota</Text></Pressable>
            <Pressable accessibilityRole="button" style={boton} onPress={p.alCancelarNota}><Text style={{ color: t.ink }}>Cancelar</Text></Pressable>
          </View>
        </>
      ) : (
        <>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            {COLORES_SUBRAYADO.map((color) => (
              <Pressable
                key={color}
                accessibilityRole="button"
                accessibilityLabel={`Subrayar en ${ROTULO_COLOR[color].toLowerCase()}`}
                accessibilityState={{ selected: actual === color }}
                onPress={() => p.alColor(color)}
                hitSlop={4}
                style={{ width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", borderWidth: actual === color ? 3 : 1, borderColor: actual === color ? t.ink : t.line }}
              >
                <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: MUESTRA[color] }} />
              </Pressable>
            ))}
            <View style={{ flex: 1 }} />
            <Pressable accessibilityRole="button" accessibilityLabel="Cerrar la barra de marcas" style={boton} onPress={p.alCerrar}><Text style={{ color: t.ink }}>Cerrar</Text></Pressable>
          </View>
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            <Pressable accessibilityRole="button" style={boton} onPress={p.alAnotar}><Text style={{ color: t.ink }}>Anotar</Text></Pressable>
            <Pressable accessibilityRole="button" style={boton} onPress={p.alMarcar}><Text style={{ color: t.ink }}>{p.marcado ? "Quitar marcador" : "Marcar"}</Text></Pressable>
            {p.colorActual ? (
              <Pressable accessibilityRole="button" style={boton} onPress={p.alQuitarSubrayado}><Text style={{ color: t.ink }}>Quitar subrayado</Text></Pressable>
            ) : (
              <Pressable accessibilityRole="button" style={boton} onPress={p.alAmpliarBloque}><Text style={{ color: t.ink }}>Todo el párrafo</Text></Pressable>
            )}
            {p.notas.map((n) => (
              <Pressable key={n.id} accessibilityRole="button" style={boton} onPress={() => p.alBorrarNota(n.id)}><Text style={{ color: t.ink }}>Borrar nota</Text></Pressable>
            ))}
          </View>
          {!p.colorActual && p.hayRango ? <Text style={{ color: t.muted, fontSize: 13 }}>Mantén pulsada otra frase del párrafo para ampliar la selección.</Text> : null}
        </>
      )}
    </View>
  );
}
