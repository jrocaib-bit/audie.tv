import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";
import Svg, { Defs, Line, Path, RadialGradient, Rect, Stop } from "react-native-svg";
import type { TipoSala } from "../sala-lugares";

type Props = {
  sala: TipoSala;
  width: number;
  height: number;
};

/**
 * Recrea el espacio arquitectónico real donde vive la obra (sin fotos externas ni datos inventados):
 * galería holandesa, salón clásico de museo, capilla/arcada de piedra para vitrales,
 * gabinete de estampas o alcoba escultórica.
 */
export function ArquitecturaSala({ sala, width, height }: Props) {
  const w = Math.max(1, width);
  const h = Math.max(1, height);
  const sueloY = Math.round(h * 0.77);
  const zocaloY = Math.round(h * 0.68);
  const cornisaY = Math.round(h * 0.11);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={
          sala === "capilla-vitral"
            ? ["#0B0C10", "#111013", "#09080A"]
            : sala === "galeria-holandesa"
              ? ["#18130F", "#120F0C", "#0B0908"]
              : ["#151311", "#100E0C", "#0A0908"]
        }
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />

      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="focoSala" cx="50%" cy="38%" rx="52%" ry="46%">
            <Stop
              offset="0%"
              stopColor={sala === "capilla-vitral" ? "#F0D399" : "#E0C48A"}
              stopOpacity={sala === "capilla-vitral" ? "0.26" : "0.18"}
            />
            <Stop offset="55%" stopColor="#C9A96E" stopOpacity="0.06" />
            <Stop offset="100%" stopColor="#0C0B09" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="luzSuelo" cx="50%" cy="84%" rx="48%" ry="18%">
            <Stop offset="0%" stopColor="#C9A96E" stopOpacity="0.11" />
            <Stop offset="100%" stopColor="#0C0B09" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Baño de luz del foco principal */}
        <Rect x={0} y={0} width={w} height={h} fill="url(#focoSala)" />

        {/* Líneas de perspectiva del techo y del suelo */}
        <Line x1={0} y1={cornisaY} x2={w} y2={cornisaY} stroke="rgba(201,169,110,0.16)" strokeWidth={1} />
        <Line x1={0} y1={cornisaY + 7} x2={w} y2={cornisaY + 7} stroke="rgba(244,236,226,0.06)" strokeWidth={1} />

        {/* Suelo de la sala y zócalo */}
        <Rect x={0} y={sueloY} width={w} height={h - sueloY} fill="rgba(7,6,5,0.72)" />
        <Rect x={0} y={sueloY} width={w} height={h - sueloY} fill="url(#luzSuelo)" />
        <Line x1={0} y1={sueloY} x2={w} y2={sueloY} stroke="rgba(201,169,110,0.22)" strokeWidth={1} />

        {sala === "capilla-vitral" ? (
          <>
            {/* Arco ojival de piedra detrás del vitral */}
            <Path
              d={`M ${w * 0.10} ${sueloY} L ${w * 0.10} ${h * 0.36} Q ${w * 0.10} ${h * 0.14} ${w * 0.50} ${h * 0.08} Q ${w * 0.90} ${h * 0.14} ${w * 0.90} ${h * 0.36} L ${w * 0.90} ${sueloY}`}
              fill="none"
              stroke="rgba(183,171,156,0.22)"
              strokeWidth={2}
            />
            <Path
              d={`M ${w * 0.14} ${sueloY} L ${w * 0.14} ${h * 0.37} Q ${w * 0.14} ${h * 0.17} ${w * 0.50} ${h * 0.115} Q ${w * 0.86} ${h * 0.17} ${w * 0.86} ${h * 0.37} L ${w * 0.86} ${sueloY}`}
              fill="none"
              stroke="rgba(224,196,138,0.14)"
              strokeWidth={1}
            />
            {/* Sillería discreta de piedra */}
            {[0.24, 0.38, 0.52, 0.65].map((r) => (
              <Line key={r} x1={0} y1={h * r} x2={w * 0.10} y2={h * r} stroke="rgba(244,236,226,0.05)" strokeWidth={1} />
            ))}
            {[0.24, 0.38, 0.52, 0.65].map((r) => (
              <Line key={`r-${r}`} x1={w * 0.90} y1={h * r} x2={w} y2={h * r} stroke="rgba(244,236,226,0.05)" strokeWidth={1} />
            ))}
          </>
        ) : null}

        {sala === "galeria-holandesa" || sala === "galeria-clasica" ? (
          <>
            {/* Moldura de arrimadero / zócalo */}
            <Rect x={0} y={zocaloY} width={w} height={sueloY - zocaloY} fill="rgba(18,15,12,0.55)" />
            <Line x1={0} y1={zocaloY} x2={w} y2={zocaloY} stroke="rgba(201,169,110,0.16)" strokeWidth={1} />
            {/* Pilastras / paneles laterales de museo */}
            <Rect
              x={w * 0.06}
              y={cornisaY + 14}
              width={w * 0.88}
              height={zocaloY - (cornisaY + 22)}
              fill="none"
              stroke="rgba(244,236,226,0.05)"
              strokeWidth={1}
            />
            {/* Barandilla discreta de sala */}
            <Line x1={w * 0.14} y1={sueloY - 12} x2={w * 0.86} y2={sueloY - 12} stroke="rgba(201,169,110,0.22)" strokeWidth={1.2} />
            <Line x1={w * 0.18} y1={sueloY - 12} x2={w * 0.18} y2={sueloY + 10} stroke="rgba(201,169,110,0.2)" strokeWidth={1.4} />
            <Line x1={w * 0.82} y1={sueloY - 12} x2={w * 0.82} y2={sueloY + 10} stroke="rgba(201,169,110,0.2)" strokeWidth={1.4} />
          </>
        ) : null}

        {sala === "gabinete-estampas" ? (
          <>
            {/* Estanterías / vitrinas laterales de gabinete */}
            <Rect x={w * 0.03} y={cornisaY + 12} width={w * 0.09} height={sueloY - cornisaY - 12} fill="rgba(27,22,18,0.55)" stroke="rgba(201,169,110,0.12)" strokeWidth={1} />
            <Rect x={w * 0.88} y={cornisaY + 12} width={w * 0.09} height={sueloY - cornisaY - 12} fill="rgba(27,22,18,0.55)" stroke="rgba(201,169,110,0.12)" strokeWidth={1} />
            {[0.25, 0.39, 0.53, 0.67].map((r) => (
              <Line key={r} x1={w * 0.03} y1={h * r} x2={w * 0.12} y2={h * r} stroke="rgba(201,169,110,0.12)" strokeWidth={1} />
            ))}
            {[0.25, 0.39, 0.53, 0.67].map((r) => (
              <Line key={`g-${r}`} x1={w * 0.88} y1={h * r} x2={w * 0.97} y2={h * r} stroke="rgba(201,169,110,0.12)" strokeWidth={1} />
            ))}
          </>
        ) : null}

        {sala === "galeria-piedra" ? (
          <>
            {/* Pedestal arquitectónico bajo la obra */}
            <Rect x={w * 0.28} y={sueloY - 34} width={w * 0.44} height={34} fill="rgba(34,30,26,0.75)" stroke="rgba(201,169,110,0.22)" strokeWidth={1} />
            <Line x1={w * 0.24} y1={sueloY - 34} x2={w * 0.76} y2={sueloY - 34} stroke="rgba(244,236,226,0.14)" strokeWidth={1.5} />
          </>
        ) : null}

        {/* Perspectiva del pavimento hacia el fondo */}
        <Line x1={w * 0.14} y1={sueloY} x2={0} y2={h} stroke="rgba(201,169,110,0.08)" strokeWidth={1} />
        <Line x1={w * 0.86} y1={sueloY} x2={w} y2={h} stroke="rgba(201,169,110,0.08)" strokeWidth={1} />
      </Svg>
    </View>
  );
}
