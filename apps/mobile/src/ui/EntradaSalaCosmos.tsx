import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Defs, Ellipse, Line, Path, RadialGradient, Rect, Stop } from "react-native-svg";
import type { LugarObra, TipoSilueta } from "../sala-lugares";
import { fonts } from "../theme";

type Props = {
  lugar: LugarObra;
  lang: "es" | "en";
  width: number;
  height: number;
  saltarLabel: string;
  onTerminar: () => void;
};

const ESTRELLAS = [
  { x: 0.10, y: 0.12, r: 1.8, a: 0.90 },
  { x: 0.24, y: 0.08, r: 1.2, a: 0.65 },
  { x: 0.42, y: 0.16, r: 2.0, a: 0.95 },
  { x: 0.65, y: 0.10, r: 1.4, a: 0.75 },
  { x: 0.84, y: 0.15, r: 1.8, a: 0.90 },
  { x: 0.17, y: 0.29, r: 1.3, a: 0.70 },
  { x: 0.74, y: 0.27, r: 1.6, a: 0.80 },
  { x: 0.91, y: 0.34, r: 1.2, a: 0.60 },
  { x: 0.08, y: 0.46, r: 1.6, a: 0.75 },
  { x: 0.33, y: 0.41, r: 1.3, a: 0.65 },
  { x: 0.62, y: 0.44, r: 1.9, a: 0.95 },
  { x: 0.83, y: 0.52, r: 1.4, a: 0.75 },
  { x: 0.14, y: 0.64, r: 1.7, a: 0.85 },
  { x: 0.40, y: 0.69, r: 1.2, a: 0.60 },
  { x: 0.58, y: 0.62, r: 1.5, a: 0.80 },
  { x: 0.80, y: 0.71, r: 1.8, a: 0.90 },
  { x: 0.22, y: 0.82, r: 1.4, a: 0.70 },
  { x: 0.51, y: 0.86, r: 1.6, a: 0.80 },
  { x: 0.89, y: 0.80, r: 1.3, a: 0.65 },
];

function SiluetaEdificio({ tipo, w, h }: { tipo: TipoSilueta; w: number; h: number }) {
  const cx = w / 2;
  const baseY = h * 0.64;
  const stroke = "rgba(224,196,138,0.86)";
  const fill = "rgba(22,18,15,0.96)";
  const ciudadFill = "rgba(18,15,12,0.85)";
  const ciudadStroke = "rgba(201,169,110,0.34)";

  return (
    <>
      {/* Resplandor detrás del edificio */}
      <Circle cx={cx} cy={baseY - 56} r={145} fill="rgba(201,169,110,0.12)" />

      {/* Horizonte urbano estilizado a izquierda y derecha */}
      <Rect x={cx - 190} y={baseY - 38} width={28} height={38} fill={ciudadFill} stroke={ciudadStroke} strokeWidth={1} />
      <Rect x={cx - 160} y={baseY - 54} width={30} height={54} fill={ciudadFill} stroke={ciudadStroke} strokeWidth={1} />
      <Rect x={cx + 130} y={baseY - 52} width={28} height={52} fill={ciudadFill} stroke={ciudadStroke} strokeWidth={1} />
      <Rect x={cx + 160} y={baseY - 34} width={30} height={34} fill={ciudadFill} stroke={ciudadStroke} strokeWidth={1} />
      <Line x1={18} y1={baseY} x2={w - 18} y2={baseY} stroke="rgba(224,196,138,0.45)" strokeWidth={1.2} />

      {tipo === "rijksmuseum" ? (
        <>
          <Rect x={cx - 120} y={baseY - 72} width={240} height={72} fill={fill} stroke={stroke} strokeWidth={1.5} />
          <Rect x={cx - 56} y={baseY - 122} width={20} height={122} fill={fill} stroke={stroke} strokeWidth={1.5} />
          <Rect x={cx + 36} y={baseY - 122} width={20} height={122} fill={fill} stroke={stroke} strokeWidth={1.5} />
          <Path d={`M ${cx - 59} ${baseY - 122} L ${cx - 46} ${baseY - 156} L ${cx - 33} ${baseY - 122} Z`} fill={fill} stroke={stroke} strokeWidth={1.5} />
          <Path d={`M ${cx + 33} ${baseY - 122} L ${cx + 46} ${baseY - 156} L ${cx + 59} ${baseY - 122} Z`} fill={fill} stroke={stroke} strokeWidth={1.5} />
          <Path d={`M ${cx - 28} ${baseY - 72} L ${cx} ${baseY - 104} L ${cx + 28} ${baseY - 72} Z`} fill={fill} stroke={stroke} strokeWidth={1.5} />
          <Path d={`M ${cx - 18} ${baseY} L ${cx - 18} ${baseY - 38} Q ${cx} ${baseY - 56} ${cx + 18} ${baseY - 38} L ${cx + 18} ${baseY} Z`} fill="rgba(224,196,138,0.34)" stroke={stroke} strokeWidth={1.6} />
          {[-92, -74, 74, 92].map((dx) => (
            <Rect key={dx} x={cx + dx - 4} y={baseY - 50} width={8} height={18} rx={2} fill="rgba(224,196,138,0.28)" />
          ))}
        </>
      ) : tipo === "met" ? (
        <>
          <Rect x={cx - 128} y={baseY - 76} width={256} height={76} fill={fill} stroke={stroke} strokeWidth={1.5} />
          <Rect x={cx - 136} y={baseY - 85} width={272} height={9} fill={fill} stroke={stroke} strokeWidth={1.4} />
          {[-92, -56, 56, 92].map((dx) => (
            <Line key={dx} x1={cx + dx} y1={baseY - 76} x2={cx + dx} y2={baseY} stroke={stroke} strokeWidth={2.2} />
          ))}
          {[-24, 0, 24].map((dx) => (
            <Path
              key={dx}
              d={`M ${cx + dx - 10} ${baseY} L ${cx + dx - 10} ${baseY - 40} Q ${cx + dx} ${baseY - 54} ${cx + dx + 10} ${baseY - 40} L ${cx + dx + 10} ${baseY} Z`}
              fill={dx === 0 ? "rgba(224,196,138,0.38)" : "rgba(224,196,138,0.18)"}
              stroke={stroke}
              strokeWidth={1.4}
            />
          ))}
        </>
      ) : tipo === "capilla" ? (
        <>
          <Path d={`M ${cx - 92} ${baseY} L ${cx - 92} ${baseY - 82} Q ${cx - 92} ${baseY - 128} ${cx} ${baseY - 154} Q ${cx + 92} ${baseY - 128} ${cx + 92} ${baseY - 82} L ${cx + 92} ${baseY} Z`} fill={fill} stroke={stroke} strokeWidth={1.6} />
          <Circle cx={cx} cy={baseY - 94} r={22} fill="rgba(224,196,138,0.28)" stroke={stroke} strokeWidth={1.5} />
          <Path d={`M ${cx - 22} ${baseY} L ${cx - 22} ${baseY - 44} Q ${cx} ${baseY - 64} ${cx + 22} ${baseY - 44} L ${cx + 22} ${baseY} Z`} fill="rgba(224,196,138,0.36)" stroke={stroke} strokeWidth={1.6} />
        </>
      ) : tipo === "getty" ? (
        <>
          <Rect x={cx - 126} y={baseY - 58} width={104} height={58} fill={fill} stroke={stroke} strokeWidth={1.4} />
          <Rect x={cx + 22} y={baseY - 72} width={104} height={72} fill={fill} stroke={stroke} strokeWidth={1.4} />
          <Rect x={cx - 42} y={baseY - 92} width={84} height={92} fill={fill} stroke={stroke} strokeWidth={1.6} />
          <Rect x={cx - 18} y={baseY - 52} width={36} height={52} fill="rgba(224,196,138,0.34)" stroke={stroke} strokeWidth={1.5} />
        </>
      ) : (
        <>
          <Rect x={cx - 116} y={baseY - 70} width={232} height={70} fill={fill} stroke={stroke} strokeWidth={1.5} />
          <Path d={`M ${cx - 72} ${baseY - 70} L ${cx} ${baseY - 108} L ${cx + 72} ${baseY - 70} Z`} fill={fill} stroke={stroke} strokeWidth={1.5} />
          {[-52, -26, 26, 52].map((dx) => (
            <Line key={dx} x1={cx + dx} y1={baseY - 70} x2={cx + dx} y2={baseY} stroke={stroke} strokeWidth={1.8} />
          ))}
          <Rect x={cx - 16} y={baseY - 44} width={32} height={44} fill="rgba(224,196,138,0.36)" stroke={stroke} strokeWidth={1.5} />
        </>
      )}
    </>
  );
}

/**
 * Entrada cinematográfica corta (~2.9 s, saltable con un toque y respetando reducir movimiento):
 * Universo -> Globo terráqueo con coordenadas reales -> Ciudad y edificio -> Sala frente a la obra.
 */
export function EntradaSalaCosmos({ lugar, lang, width, height, saltarLabel, onTerminar }: Props) {
  const progreso = useSharedValue(0);

  useEffect(() => {
    progreso.value = 0;
    progreso.value = withTiming(
      1,
      { duration: 2900, easing: Easing.inOut(Easing.cubic) },
      (finished) => {
        if (finished) runOnJS(onTerminar)();
      },
    );
  }, [lugar.id, onTerminar, progreso]);

  const estiloFondo = useAnimatedStyle(() => ({
    opacity: interpolate(progreso.value, [0, 0.88, 1], [1, 1, 0], Extrapolation.CLAMP),
  }));

  const estiloCosmos = useAnimatedStyle(() => ({
    opacity: interpolate(progreso.value, [0, 0.25, 0.45], [1, 0.9, 0], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(progreso.value, [0, 0.45], [1, 2.4], Extrapolation.CLAMP) }],
  }));

  const estiloTierra = useAnimatedStyle(() => ({
    opacity: interpolate(progreso.value, [0.06, 0.18, 0.48, 0.62], [0, 1, 1, 0], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(progreso.value, [0.06, 0.62], [0.55, 3.6], Extrapolation.CLAMP) }],
  }));

  const estiloEdificio = useAnimatedStyle(() => ({
    opacity: interpolate(progreso.value, [0.46, 0.58, 0.82, 0.96], [0, 1, 1, 0], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(progreso.value, [0.46, 0.96], [0.76, 2.6], Extrapolation.CLAMP) }],
  }));

  const cx = width / 2;
  const cy = height * 0.45;
  const ciudad = lugar.ciudad[lang] || lugar.ciudad.es;
  const edificio = lugar.edificio[lang] || lugar.edificio.es;
  const hayCoords = Boolean(lugar.coordenadasTexto);

  const pinDx = lugar.lon != null ? ((lugar.lon % 40) / 40) * 18 : 0;
  const pinDy = lugar.lat != null ? -((lugar.lat - 35) / 55) * 20 : 0;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { zIndex: 40, backgroundColor: "#050507" }, estiloFondo]}>
      <Pressable onPress={onTerminar} accessibilityRole="button" accessibilityLabel={saltarLabel} style={StyleSheet.absoluteFill}>
        {/* Capa 1: Universo y estrellas */}
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, estiloCosmos]}>
          <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            <Defs>
              <RadialGradient id="nebulosa" cx="50%" cy="45%" rx="55%" ry="45%">
                <Stop offset="0%" stopColor="#C9A96E" stopOpacity="0.22" />
                <Stop offset="55%" stopColor="#262019" stopOpacity="0.16" />
                <Stop offset="100%" stopColor="#050507" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Rect x={0} y={0} width={width} height={height} fill="url(#nebulosa)" />
            {ESTRELLAS.map((s, idx) => (
              <Circle key={idx} cx={s.x * width} cy={s.y * height} r={s.r} fill="#F4ECE2" opacity={s.a} />
            ))}
          </Svg>
        </Animated.View>

        {/* Capa 2: Planeta Tierra y coordenadas reales */}
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, estiloTierra]}>
          <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            <Defs>
              <RadialGradient id="tierraGlow" cx="42%" cy="38%" rx="58%" ry="58%">
                <Stop offset="0%" stopColor="#436B93" stopOpacity="0.92" />
                <Stop offset="55%" stopColor="#1E354D" stopOpacity="0.96" />
                <Stop offset="100%" stopColor="#0D1622" stopOpacity="1" />
              </RadialGradient>
            </Defs>
            {/* Halo atmosférico */}
            <Circle cx={cx} cy={cy} r={126} fill="rgba(120,170,220,0.12)" />
            <Circle cx={cx} cy={cy} r={108} fill="url(#tierraGlow)" stroke="rgba(224,196,138,0.72)" strokeWidth={1.6} />
            {/* Meridianos y paralelos */}
            <Ellipse cx={cx} cy={cy} rx={108} ry={34} fill="none" stroke="rgba(244,236,226,0.22)" strokeWidth={1} />
            <Ellipse cx={cx} cy={cy} rx={46} ry={108} fill="none" stroke="rgba(244,236,226,0.22)" strokeWidth={1} />
            <Line x1={cx - 108} y1={cy} x2={cx + 108} y2={cy} stroke="rgba(244,236,226,0.18)" strokeWidth={1} />
            {/* Silueta ilustrada de continentes */}
            <Path
              d={`M ${cx - 72} ${cy - 48} Q ${cx - 40} ${cy - 68} ${cx - 10} ${cy - 44} Q ${cx + 12} ${cy - 28} ${cx - 24} ${cy - 6} Q ${cx - 56} ${cy + 18} ${cx - 64} ${cy - 18} Z`}
              fill="rgba(224,196,138,0.34)"
              stroke="rgba(244,236,226,0.25)"
              strokeWidth={0.8}
            />
            <Path
              d={`M ${cx + 8} ${cy - 54} Q ${cx + 58} ${cy - 60} ${cx + 80} ${cy - 20} Q ${cx + 60} ${cy + 14} ${cx + 22} ${cy + 26} Q ${cx + 4} ${cy - 10} ${cx + 8} ${cy - 54} Z`}
              fill="rgba(224,196,138,0.38)"
              stroke="rgba(244,236,226,0.25)"
              strokeWidth={0.8}
            />
            {hayCoords ? (
              <>
                <Circle cx={cx + pinDx} cy={cy + pinDy} r={20} fill="rgba(224,196,138,0.22)" stroke="rgba(224,196,138,0.55)" strokeWidth={1} />
                <Circle cx={cx + pinDx} cy={cy + pinDy} r={6} fill="#E0C48A" />
              </>
            ) : null}
          </Svg>
        </Animated.View>

        {/* Capa 3: Ciudad y arquitectura del edificio */}
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, estiloEdificio]}>
          <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            <SiluetaEdificio tipo={lugar.silueta} w={width} h={height} />
          </Svg>
        </Animated.View>

        {/* Rótulo sutil de destino y botón saltar */}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: 24,
            right: 24,
            bottom: 112,
            alignItems: "center",
            gap: 4,
          }}
        >
          {edificio ? (
            <Text numberOfLines={2} style={{ color: "#F4ECE2", fontFamily: fonts.serif, fontSize: 20, lineHeight: 25, textAlign: "center" }}>
              {edificio}
            </Text>
          ) : null}
          {ciudad || hayCoords ? (
            <Text style={{ color: "#C9A96E", fontFamily: fonts.sans, fontSize: 13, letterSpacing: 0.6, textAlign: "center" }}>
              {[ciudad, lugar.coordenadasTexto].filter(Boolean).join(" · ")}
            </Text>
          ) : null}
        </View>

        <View style={{ position: "absolute", right: 20, top: 54 }}>
          <View
            style={{
              paddingHorizontal: 14,
              paddingVertical: 7,
              borderRadius: 999,
              backgroundColor: "rgba(27,24,21,0.82)",
              borderWidth: 1,
              borderColor: "rgba(201,169,110,0.4)",
            }}
          >
            <Text style={{ color: "#F4ECE2", fontFamily: fonts.medium, fontSize: 12 }}>{saltarLabel}</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}
