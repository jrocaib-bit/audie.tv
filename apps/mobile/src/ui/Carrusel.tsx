import { useEffect, useRef, type ReactNode } from "react";
import { ScrollView, View, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import { useMovimientoReducido } from "./tema";

type Props = {
  n: number;
  /** Elemento activo (controlado). */
  indice: number;
  onCambia: (i: number) => void;
  ancho: number;
  alto: number;
  /** Ancho visible: el activo se centra y los vecinos asoman a los lados. */
  vista: number;
  separacion?: number;
  /** Cambia cuando el contenido se rehace y hay que recolocar sin animar. */
  clave?: string;
  render: (i: number, activo: boolean) => ReactNode;
};

/** Paginado horizontal con vecinos asomando. Rebota en los extremos, no da la vuelta. */
export function Carrusel({ n, indice, onCambia, ancho, alto, vista, separacion = 12, clave, render }: Props) {
  const ref = useRef<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any -- el tipo de instancia de ScrollView no se exporta;
  const reducir = useMovimientoReducido();
  const paso = ancho + separacion;
  const indiceRef = useRef(indice);
  indiceRef.current = indice;
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  const primera = useRef(true);
  const claveAnterior = useRef(clave);
  const programando = useRef(false);
  const suelta = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Si el contenido se rehízo (otra clave), se recoloca de golpe: es la misma imagen en otro sitio.
    const rehecho = claveAnterior.current !== clave;
    programando.current = true;
    if (suelta.current) clearTimeout(suelta.current);
    ref.current?.scrollTo({ x: indice * paso, animated: !primera.current && !rehecho && !reducir });
    claveAnterior.current = clave;
    primera.current = false;
    // Mientras dura el scroll programado no se interpreta el desplazamiento como un gesto.
    suelta.current = setTimeout(() => { programando.current = false; }, 500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indice, clave, paso]);
  useEffect(() => () => {
    if (temporizador.current) clearTimeout(temporizador.current);
    if (suelta.current) clearTimeout(suelta.current);
  }, []);

  const asentar = (x: number) => {
    if (programando.current) return;
    const i = Math.min(n - 1, Math.max(0, Math.round(x / paso)));
    if (i !== indiceRef.current) {
      onCambia(i);
      // Si quien manda no se mueve (p. ej. «anterior» que solo reinicia), vuelve al sitio.
      setTimeout(() => ref.current?.scrollTo({ x: indiceRef.current * paso, animated: !reducir }), 450);
    } else if (Math.abs(x - i * paso) > 2) {
      ref.current?.scrollTo({ x: i * paso, animated: !reducir });
    }
  };
  const alMover = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => asentar(x), 140);
  };
  const lado = Math.max(0, (vista - ancho) / 2);

  return (
    <View style={{ height: alto, width: vista }}>
      <ScrollView
        ref={ref}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={paso}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum
        bounces
        scrollEventThrottle={16}
        onScroll={alMover}
        onMomentumScrollEnd={(e) => {
          if (temporizador.current) clearTimeout(temporizador.current);
          asentar(e.nativeEvent.contentOffset.x);
        }}
        contentContainerStyle={{ paddingHorizontal: lado, gap: separacion }}
      >
        {Array.from({ length: n }, (_, i) => {
          const activo = i === indice;
          return (
            <View key={i} accessibilityElementsHidden={!activo} importantForAccessibility={activo ? "auto" : "no-hide-descendants"} style={{ width: ancho, height: alto, opacity: activo ? 1 : 0.5 }}>
              {render(i, activo)}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
