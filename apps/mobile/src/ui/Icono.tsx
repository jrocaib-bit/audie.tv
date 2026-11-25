import Svg, { Circle, Path, Rect, Text as SvgText } from "react-native-svg";

export type NombreIcono =
  | "hoy" | "caminos" | "retos" | "sala" | "orbita" | "biblioteca" | "ajustes"
  | "play" | "pause" | "atras" | "adelante" | "chevron" | "abajo" | "cerrar" | "info"
  | "llama" | "check" | "candado" | "reloj" | "luna" | "texto" | "usuario" | "campana"
  | "anterior" | "siguiente" | "ondas" | "velocidad" | "idioma" | "descarga" | "estrella" | "ayuda" | "borrar" | "libro" | "arriba" | "ojo" | "oculto";

type Props = { nombre: NombreIcono; size?: number; color: string; trazo?: number; segundos?: number };

/** Iconos de línea propios, en una rejilla de 24. */
export function Icono({ nombre, size = 24, color, trazo = 1.8, segundos = 15 }: Props) {
  const linea = { stroke: color, strokeWidth: trazo, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };
  let dibujo: React.ReactNode = null;
  switch (nombre) {
    case "orbita":
      dibujo = (<><Circle cx={12} cy={12} r={8.5} {...linea} /><Path d="M3.8 12h16.4M12 3.5c2.6 2.5 3.6 5.4 3.6 8.5s-1 6-3.6 8.5c-2.6-2.5-3.6-5.4-3.6-8.5s1-6 3.6-8.5z" {...linea} /><Circle cx={16.5} cy={7.5} r={1.6} fill={color} /></>);
      break;
    case "sala":
      dibujo = (<><Rect x={4} y={4.5} width={16} height={15} rx={2} {...linea} /><Rect x={7.5} y={8} width={9} height={8} rx={0.8} {...linea} /></>);
      break;
    case "hoy":
      dibujo = (<><Circle cx={12} cy={12} r={4} {...linea} /><Path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6L7 7M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4" {...linea} /></>);
      break;
    case "caminos":
      dibujo = (<><Circle cx={6} cy={18} r={2.2} {...linea} /><Circle cx={18} cy={6} r={2.2} {...linea} /><Path d="M8.2 18H15a3.5 3.5 0 000-7H9a3.5 3.5 0 010-7h6.8" {...linea} /></>);
      break;
    case "biblioteca":
      dibujo = (<><Path d="M5 4.5h10.5A2.5 2.5 0 0118 7v13H7.5A2.5 2.5 0 015 17.5v-13z" {...linea} /><Path d="M5 17.5A2.5 2.5 0 017.5 15H18" {...linea} /></>);
      break;
    case "ajustes":
      dibujo = (<><Path d="M4 7h9M19 7h1M4 17h1M11 17h9" {...linea} /><Circle cx={16} cy={7} r={2.5} {...linea} /><Circle cx={8} cy={17} r={2.5} {...linea} /></>);
      break;
    case "play":
      dibujo = <Path d="M8 5.2v13.6a.6.6 0 00.9.5l11-6.8a.6.6 0 000-1L8.9 4.7a.6.6 0 00-.9.5z" fill={color} />;
      break;
    case "pause":
      dibujo = (<><Rect x={6} y={5} width={4} height={14} rx={1.2} fill={color} /><Rect x={14} y={5} width={4} height={14} rx={1.2} fill={color} /></>);
      break;
    case "atras":
    case "adelante": {
      const atras = nombre === "atras";
      dibujo = (
        <>
          <Path d={atras ? "M12 4.5a8 8 0 11-7.6 5.6" : "M12 4.5a8 8 0 107.6 5.6"} {...linea} />
          <Path d={atras ? "M12 1.5L9 4.5l3 3" : "M12 1.5l3 3-3 3"} {...linea} />
          <SvgText x={12} y={15.3} fontSize={7.5} fontWeight="700" fill={color} textAnchor="middle">{String(segundos)}</SvgText>
        </>
      );
      break;
    }
    case "anterior": dibujo = (<><Path d="M6.500 5v14" {...linea} strokeWidth={2.200} /><Path d="M19 5.800v12.400a.5.5 0 01-.8.4L9.500 12.400a.5.5 0 010-.8l8.700-6.200a.5.5 0 01.8.4z" fill={color} /></>); break;
    case "siguiente": dibujo = (<><Path d="M17.500 5v14" {...linea} strokeWidth={2.200} /><Path d="M5 5.800v12.400a.5.5 0 00.8.4l8.700-6.200a.5.5 0 000-.8L5.800 5.400a.5.5 0 00-.8.4z" fill={color} /></>); break;
    case "retos": dibujo = (<><Path d="M8 4h8v5a4 4 0 01-8 0V4z" {...linea} /><Path d="M8 6H5v1a3 3 0 003 3M16 6h3v1a3 3 0 01-3 3M12 13v4M9 20h6M10 17h4" {...linea} /></>); break;
    case "ondas": dibujo = <Path d="M6 14v5M12 5v14M18 10v9" {...linea} strokeWidth={3} />; break;
    case "chevron": dibujo = <Path d="M9 5.5l6.5 6.5L9 18.5" {...linea} />; break;
    case "abajo": dibujo = <Path d="M5.5 9l6.5 6.5L18.5 9" {...linea} />; break;
    case "arriba": dibujo = <Path d="M5.5 15l6.5-6.5L18.5 15" {...linea} />; break;
    case "ojo":
    case "oculto":
      dibujo = (
        <>
          <Path d="M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12z" {...linea} />
          <Circle cx={12} cy={12} r={3} {...linea} />
          {nombre === "oculto" ? <Path d="M4 4l16 16" {...linea} /> : null}
        </>
      );
      break;
    case "cerrar": dibujo = <Path d="M6 6l12 12M18 6L6 18" {...linea} />; break;
    case "info": dibujo = (<><Circle cx={12} cy={12} r={9} {...linea} /><Path d="M12 11v5.5M12 7.8v.1" {...linea} /></>); break;
    case "llama": dibujo = <Path d="M12 3c.6 3.2 5 5.2 5 10.2a5 5 0 01-10 0c0-2.2 1-3.7 2.2-4.7.1 1.8.9 2.7 1.9 2.9C10.200 8.800 10.600 5.600 12 3z" {...linea} />; break;
    case "check": dibujo = <Path d="M5 12.5l4.5 4.5L19 7.5" {...linea} />; break;
    case "candado": dibujo = (<><Rect x={5} y={10.5} width={14} height={9.5} rx={2.5} {...linea} /><Path d="M8 10.5V8a4 4 0 018 0v2.5" {...linea} /></>); break;
    case "reloj": dibujo = (<><Circle cx={12} cy={12} r={9} {...linea} /><Path d="M12 7v5l3 2" {...linea} /></>); break;
    case "luna": dibujo = <Path d="M19.5 14.500A8 8 0 019.500 4.500a8 8 0 1010 10z" {...linea} />; break;
    case "texto": dibujo = (<><Rect x={3.5} y={5.5} width={17} height={13} rx={3} {...linea} /><Path d="M7.500 11h4M7.500 14.500h8" {...linea} /></>); break;
    case "usuario": dibujo = (<><Circle cx={12} cy={8.500} r={3.500} {...linea} /><Path d="M5 20c.7-3.600 3.500-5.500 7-5.500s6.300 1.900 7 5.500" {...linea} /></>); break;
    case "campana": dibujo = (<><Path d="M6 16.500V11a6 6 0 0112 0v5.500l1.500 1.500h-15L6 16.500z" {...linea} /><Path d="M10 20.500a2.200 2.200 0 004 0" {...linea} /></>); break;
    case "velocidad": dibujo = (<><Path d="M4 17a8 8 0 1116 0" {...linea} /><Path d="M12 17l4-5" {...linea} /></>); break;
    case "idioma": dibujo = (<><Circle cx={12} cy={12} r={9} {...linea} /><Path d="M3 12h18M12 3c2.500 2.500 3.500 5.500 3.500 9S14.500 18.500 12 21c-2.500-2.500-3.500-5.500-3.500-9S9.500 5.500 12 3z" {...linea} /></>); break;
    case "descarga": dibujo = <Path d="M12 4v11M7.500 11l4.500 4.500 4.500-4.500M5 19.500h14" {...linea} />; break;
    case "estrella": dibujo = <Path d="M12 3.500l2.600 5.300 5.800.8-4.200 4.100 1 5.800-5.200-2.700-5.200 2.700 1-5.800-4.200-4.100 5.800-.8L12 3.500z" {...linea} />; break;
    case "ayuda": dibujo = (<><Circle cx={12} cy={12} r={9} {...linea} /><Path d="M9.500 9.500a2.500 2.500 0 114 2c-.9.600-1.500 1.100-1.500 2.200M12 17v.1" {...linea} /></>); break;
    case "borrar": dibujo = <Path d="M5 7h14M10 7V4.500h4V7M7 7l.8 12.500h8.400L17 7" {...linea} />; break;
    case "libro": dibujo = <Path d="M5 5.500c2.500-1 5-1 7 .8 2-1.800 4.500-1.800 7-.8v13c-2.500-1-5-1-7 .8-2-1.800-4.500-1.800-7-.8v-13z" {...linea} />; break;
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no">
      {dibujo}
    </Svg>
  );
}
