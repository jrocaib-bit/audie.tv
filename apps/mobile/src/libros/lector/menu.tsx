import type { EntradaIndice } from "@audite/domain";
import { rotuloCapitulo } from "@audite/domain";
import { useState } from "react";
import { FlatList, Modal, Pressable, Text, View } from "react-native";
import { LETRA } from "../estilos";
import { rotuloPagina } from "../paginacion";
import { PortadaLibro } from "../portada";
import { ROTULO_COLOR, MUESTRA, type MarcaLista } from "../subrayado";
import { ROTULO_TEMA, TEMAS_ORDEN, tintaSobreAcento, type ColoresLector } from "../lector-temas";
import type { ModoLector, TemaLector } from "../ajustes";

export type FilaIndice = { entrada: EntradaIndice; pagina: number | null; bloqueada: boolean };

type Props = {
  visible: boolean;
  tema: ColoresLector;
  acento: string;
  titulo: string;
  volumen: number;
  pagina: number;
  total: number;
  filas: FilaIndice[];
  actual: string | null;
  marcas: MarcaLista[];
  rotuloMarca: (marca: MarcaLista) => string;
  tam: number;
  maxTam: number;
  temaActual: TemaLector;
  modo: ModoLector;
  alCerrar: () => void;
  alIrCapitulo: (id: string) => void;
  alIrMarca: (marca: MarcaLista) => void;
  alBorrarMarca: (marca: MarcaLista) => void;
  alTam: (delta: number) => void;
  alTema: (tema: TemaLector) => void;
  alModo: (modo: ModoLector) => void;
};

/** Hoja del menú: portada, página actual, ajustes de lectura, índice con página y lista de marcas y notas. */
export function HojaMenu(p: Props) {
  const t = p.tema;
  const [pestana, setPestana] = useState<"indice" | "marcas">("indice");
  const boton = { minHeight: 44, minWidth: 44, borderRadius: 999, borderWidth: 1, borderColor: t.line, paddingHorizontal: 16, alignItems: "center" as const, justifyContent: "center" as const };
  const sel = (activo: boolean) => (activo ? { backgroundColor: p.acento, borderColor: p.acento } : {});
  const txt = (activo: boolean) => ({ color: activo ? tintaSobreAcento(p.acento) : t.ink, fontWeight: activo ? ("600" as const) : ("400" as const) });

  const cabecera = (
    <View style={{ gap: 14, paddingBottom: 10 }}>
      <View style={{ flexDirection: "row", gap: 14, alignItems: "center" }}>
        {p.volumen > 0 ? <PortadaLibro volumen={p.volumen} titulo={p.titulo} ancho={56} /> : null}
        <View style={{ flex: 1, gap: 4 }}>
          <Text accessibilityRole="header" numberOfLines={2} style={{ color: t.ink, fontFamily: LETRA, fontSize: 22, lineHeight: 26 }}>{p.titulo}</Text>
          <Text style={{ color: t.muted, fontSize: 15 }}>{p.total > 0 ? rotuloPagina(p.pagina, p.total) : ""}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Cerrar el menú" style={boton} onPress={p.alCerrar}><Text style={{ color: t.ink }}>Cerrar</Text></Pressable>
      </View>
      <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Letra más pequeña" disabled={p.tam === 0} style={[boton, { opacity: p.tam === 0 ? 0.4 : 1 }]} onPress={() => p.alTam(-1)}><Text style={{ color: t.ink, fontSize: 14 }}>A−</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Letra más grande" disabled={p.tam === p.maxTam} style={[boton, { opacity: p.tam === p.maxTam ? 0.4 : 1 }]} onPress={() => p.alTam(1)}><Text style={{ color: t.ink, fontSize: 20 }}>A+</Text></Pressable>
        <View style={{ flex: 1 }} />
        {TEMAS_ORDEN.map((id) => (
          <Pressable key={id} accessibilityRole="button" accessibilityState={{ selected: p.temaActual === id }} style={[boton, sel(p.temaActual === id)]} onPress={() => p.alTema(id)}><Text style={txt(p.temaActual === id)}>{ROTULO_TEMA[id]}</Text></Pressable>
        ))}
      </View>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Pressable accessibilityRole="button" accessibilityState={{ selected: p.modo === "paginas" }} style={[boton, { flex: 1 }, sel(p.modo === "paginas")]} onPress={() => p.alModo("paginas")}><Text style={txt(p.modo === "paginas")}>Páginas</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityState={{ selected: p.modo === "scroll" }} style={[boton, { flex: 1 }, sel(p.modo === "scroll")]} onPress={() => p.alModo("scroll")}><Text style={txt(p.modo === "scroll")}>Desplazar</Text></Pressable>
      </View>
      <View style={{ flexDirection: "row", borderBottomWidth: 1, borderBottomColor: t.line }}>
        {(["indice", "marcas"] as const).map((id) => (
          <Pressable key={id} accessibilityRole="tab" accessibilityState={{ selected: pestana === id }} onPress={() => setPestana(id)} style={{ flex: 1, minHeight: 44, alignItems: "center", justifyContent: "center", borderBottomWidth: 3, borderBottomColor: pestana === id ? p.acento : "transparent" }}>
            <Text style={{ color: pestana === id ? t.ink : t.muted, fontWeight: "600", fontSize: 15 }}>{id === "indice" ? "Índice" : `Marcas y notas${p.marcas.length ? ` (${p.marcas.length})` : ""}`}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  return (
    <Modal visible={p.visible} animationType="slide" transparent onRequestClose={p.alCerrar} accessibilityViewIsModal>
      <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }}>
        <Pressable accessibilityLabel="Cerrar el menú" accessibilityRole="button" onPress={p.alCerrar} style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }} />
        <View style={{ height: "84%", backgroundColor: t.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 16, paddingTop: 16 }}>
          {pestana === "indice" ? (
            <FlatList
              data={p.filas}
              keyExtractor={(f) => f.entrada.id}
              ListHeaderComponent={cabecera}
              contentContainerStyle={{ paddingBottom: 32 }}
              renderItem={({ item }) => (
                <Pressable accessibilityRole="button" accessibilityState={{ selected: item.entrada.id === p.actual }} onPress={() => p.alIrCapitulo(item.entrada.id)} style={{ minHeight: 56, flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: 1, borderBottomColor: t.line, paddingVertical: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: t.muted, fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase" }}>{rotuloCapitulo(item.entrada)}{item.bloqueada ? " · con suscripción" : ""}</Text>
                    <Text style={{ color: item.entrada.id === p.actual ? p.acento : t.ink, fontFamily: LETRA, fontSize: 18, lineHeight: 22 }}>{item.entrada.titulo}</Text>
                  </View>
                  {item.pagina !== null ? <Text style={{ color: t.muted, fontSize: 15, minWidth: 28, textAlign: "right" }}>{item.pagina}</Text> : null}
                </Pressable>
              )}
            />
          ) : (
            <FlatList
              data={p.marcas}
              keyExtractor={(m) => `${m.tipo}-${m.id}`}
              ListHeaderComponent={cabecera}
              contentContainerStyle={{ paddingBottom: 32 }}
              ListEmptyComponent={<Text style={{ color: t.muted, fontSize: 16, lineHeight: 24, paddingVertical: 20 }}>Aún no hay marcas. Mantén pulsada una frase del texto para subrayarla, anotarla o marcarla.</Text>}
              renderItem={({ item }) => (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, borderBottomWidth: 1, borderBottomColor: t.line, paddingVertical: 8 }}>
                  <Pressable accessibilityRole="button" onPress={() => p.alIrMarca(item)} style={{ flex: 1, minHeight: 56, flexDirection: "row", gap: 12, alignItems: "center" }}>
                    <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: item.tipo === "subrayado" ? MUESTRA[item.color] : p.acento }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: t.muted, fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase" }}>{item.tipo === "subrayado" ? `Subrayado ${ROTULO_COLOR[item.color].toLowerCase()}` : item.tipo === "nota" ? "Nota" : "Marcador"} · {p.rotuloMarca(item)}</Text>
                      <Text numberOfLines={3} style={{ color: t.ink, fontFamily: LETRA, fontSize: 16, lineHeight: 22 }}>{item.texto}</Text>
                    </View>
                  </Pressable>
                  <Pressable accessibilityRole="button" accessibilityLabel="Borrar" onPress={() => p.alBorrarMarca(item)} style={{ minHeight: 44, minWidth: 44, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ color: t.muted, fontSize: 18 }}>✕</Text>
                  </Pressable>
                </View>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}
