import type { CapituloLibro } from "@audite/domain";
import { useEffect, useRef } from "react";
import { Text, View } from "react-native";
import { LETRA } from "../estilos";
import { metricas, llevaSangria } from "../lector-estilo";
import type { ColoresLector } from "../lector-temas";
import { TextoBloque } from "./texto";

type Props = {
  capitulo: CapituloLibro;
  tamano: number;
  ancho: number;
  tema: ColoresLector;
  justificado: boolean;
  alTerminar: (capituloId: string, lineas: number[]) => void;
};

/**
 * Pinta fuera de la vista y sin interacción el título y los bloques de un capítulo al ancho útil de la página,
 * y devuelve cuántas líneas ocupa cada uno. Con esas cifras se reparten las páginas.
 */
export function MedidorCapitulo({ capitulo, tamano, ancho, tema, justificado, alTerminar }: Props) {
  const total = capitulo.bloques.length + 1;
  const lineas = useRef<(number | undefined)[]>([]);
  const hecho = useRef(false);
  const { fsTitulo, lhTitulo } = metricas(tamano);

  useEffect(() => {
    lineas.current = [];
    hecho.current = false;
  }, [capitulo.id, tamano, ancho, justificado]);

  const registrar = (indice: number, n: number) => {
    lineas.current[indice] = n;
    if (hecho.current) return;
    if (Array.from({ length: total }, (_, i) => lineas.current[i]).every((x) => x !== undefined)) {
      hecho.current = true;
      alTerminar(capitulo.id, lineas.current as number[]);
    }
  };

  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ position: "absolute", top: 0, left: 0, width: ancho, opacity: 0, pointerEvents: "none" }}>
      <Text onTextLayout={(e) => registrar(0, e.nativeEvent.lines.length)} style={{ fontFamily: LETRA, fontSize: fsTitulo, lineHeight: lhTitulo }}>{capitulo.titulo}</Text>
      {capitulo.bloques.map((bloque, i) => (
        <TextoBloque
          key={bloque.id}
          bloque={bloque}
          tamano={tamano}
          tema={tema}
          acento={tema.ink}
          sangria={llevaSangria(bloque, capitulo.bloques[i - 1])}
          subrayados={[]}
          seleccion={null}
          marcado={false}
          justificado={justificado}
          alMedir={(n) => registrar(i + 1, n)}
        />
      ))}
    </View>
  );
}
