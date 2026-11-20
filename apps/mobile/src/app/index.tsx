import { textosAlta } from "@audite/domain";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { AccessibilityInfo, Animated, Image, Pressable, ScrollView, Text, View, useColorScheme } from "react-native";
import { uriDeObra } from "../entorno";
import { tarjetasHoy, type TarjetaHoy } from "../hoy";
import { useMobileLibrary } from "../state";
import { dark, fonts, light } from "../theme";

function Rail({ titulo, items, ink, orden, alPulsar }: { titulo: string; items: TarjetaHoy[]; ink: string; orden: number; alPulsar?: (item: TarjetaHoy) => void }) {
  const opacidad = useRef(new Animated.Value(1)).current;
  const subir = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let activo = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((reducir) => {
      if (!activo || reducir) return;
      opacidad.setValue(0);
      subir.setValue(12);
      Animated.parallel([
        Animated.timing(opacidad, { toValue: 1, duration: 420, delay: orden * 80, useNativeDriver: true }),
        Animated.timing(subir, { toValue: 0, duration: 420, delay: orden * 80, useNativeDriver: true }),
      ]).start();
    });
    return () => { activo = false; };
  }, [opacidad, orden, subir]);
  return (
    <Animated.View style={{ opacity: opacidad, transform: [{ translateY: subir }] }}>
      <Text style={{ color: ink, fontFamily: fonts.serif, fontSize: 28 }}>{titulo}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingVertical: 12 }}>
        {items.map((item) => (
          <Pressable key={item.id} accessibilityRole="button" onPress={() => alPulsar?.(item)} style={{ width: 132 }}>
            <Image source={{ uri: uriDeObra(item.src) }} style={{ width: 132, height: 132, backgroundColor: "#1B1815" }} />
            <Text numberOfLines={1} style={{ color: ink, marginTop: 8 }}>{item.titulo}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </Animated.View>
  );
}

export default function Today() {
  const library = useMobileLibrary();
  const scheme = useColorScheme();
  const router = useRouter();
  const colors = library.settings.theme === "dark" || (library.settings.theme === "system" && scheme === "dark") ? dark : light;
  const lang = library.settings.uiLocale === "en" ? "en" : "es";
  const copy = textosAlta(library.settings.uiLocale);
  const tarjetas = tarjetasHoy(lang);
  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 12, paddingBottom: 120, gap: 8, backgroundColor: "#100E0C" }}>
      <Text style={{ color: "#F4ECE2", fontFamily: fonts.serif, fontSize: 40, lineHeight: 44 }}>{copy.titulo}</Text>
      <Pressable onPress={() => router.push("/suscripcion")} style={{ alignSelf: "flex-start", minHeight: 48, borderRadius: 999, backgroundColor: "#C9A96E", paddingHorizontal: 18, justifyContent: "center" }}>
        <Text style={{ color: "#100E0C" }}>{lang === "en" ? "Start 7 days free" : "Empieza 7 días gratis"}</Text>
      </Pressable>
      <Rail titulo={lang === "en" ? "Books" : "Libros"} items={tarjetas.libros} ink={colors.ink} orden={0} />
      <Rail titulo={lang === "en" ? "Paths" : "Caminos"} items={tarjetas.caminos} ink={colors.ink} orden={1} />
      <Rail titulo={lang === "en" ? "Challenges" : "Retos"} items={tarjetas.retos} ink={colors.ink} orden={2} alPulsar={(item) => { if (item.ruta) router.push(item.ruta as "/reto-adviento"); }} />
    </ScrollView>
  );
}
