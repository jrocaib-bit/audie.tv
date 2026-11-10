import { textosAlta } from "@audite/domain";
import { useRouter } from "expo-router";
import { Image, Pressable, ScrollView, Text, View, useColorScheme } from "react-native";
import { useMobileLibrary } from "../state";
import { dark, fonts, light } from "../theme";

const base = process.env.EXPO_PUBLIC_CONTENT_BASE ?? "http://127.0.0.1:43123";

const LIBROS = [
  { titulo: "El paraíso", src: "/obras/gn-01_o5-detalle-960.webp" },
  { titulo: "La expulsión", src: "/obras/gn-02_o1-960.webp" },
  { titulo: "El arca", src: "/obras/gn-03_o1-960.webp" },
  { titulo: "Babel", src: "/obras/gn-04_o1-960.webp" },
  { titulo: "Melquisedec", src: "/obras/gn-05_o1-960.webp" },
  { titulo: "Mambré", src: "/obras/gn-06_o2-960.webp" },
];

const CAMINOS = [
  { titulo: "Génesis", src: "/obras/gn-01_o5-detalle-960.webp" },
  { titulo: "El arca", src: "/obras/gn-03_o1-960.webp" },
  { titulo: "Isaac", src: "/obras/gn-08_o2-960.webp" },
  { titulo: "Jacob", src: "/obras/gn-11_o4-960.webp" },
];

const RETOS = [
  { titulo: "Adviento", src: "/obras/reto-adviento_o1-1x1.webp" },
  { titulo: "Navidad", src: "/obras/reto-navidad_o1-1x1.webp" },
];

function Rail({ titulo, items, ink }: { titulo: string; items: { titulo: string; src: string }[]; ink: string }) {
  return (
    <View>
      <Text style={{ color: ink, fontFamily: fonts.serif, fontSize: 28 }}>{titulo}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingVertical: 12 }}>
        {items.map((item) => (
          <View key={item.titulo} style={{ width: 132 }}>
            <Image source={{ uri: `${base}${item.src}` }} style={{ width: 132, height: 132, backgroundColor: "#1B1815" }} />
            <Text numberOfLines={1} style={{ color: ink, marginTop: 8 }}>{item.titulo}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export default function Today() {
  const library = useMobileLibrary();
  const scheme = useColorScheme();
  const router = useRouter();
  const colors = library.settings.theme === "dark" || (library.settings.theme === "system" && scheme === "dark") ? dark : light;
  const copy = textosAlta(library.settings.uiLocale);
  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 12, paddingBottom: 120, gap: 8, backgroundColor: "#100E0C" }}>
      <Text style={{ color: "#F4ECE2", fontFamily: fonts.serif, fontSize: 40, lineHeight: 44 }}>{copy.titulo}</Text>
      <Pressable onPress={() => router.push("/entrar")} style={{ alignSelf: "flex-start", minHeight: 48, borderRadius: 999, backgroundColor: "#C9A96E", paddingHorizontal: 18, justifyContent: "center" }}>
        <Text style={{ color: "#100E0C" }}>{library.settings.uiLocale === "en" ? "Start 7 days free" : "Empieza 7 días gratis"}</Text>
      </Pressable>
      <Rail titulo={library.settings.uiLocale === "en" ? "Books" : "Libros"} items={LIBROS} ink={colors.ink} />
      <Rail titulo={library.settings.uiLocale === "en" ? "Paths" : "Caminos"} items={CAMINOS} ink={colors.ink} />
      <Rail titulo={library.settings.uiLocale === "en" ? "Challenges" : "Retos"} items={RETOS} ink={colors.ink} />
    </ScrollView>
  );
}
