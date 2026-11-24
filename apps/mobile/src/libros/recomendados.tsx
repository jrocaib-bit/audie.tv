import type { RecomendacionLibro } from "@audite/domain";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { clienteLibrosApp } from "./cliente";
import { rutaDeRecomendacion } from "./config";
import { Cubierta } from "./cubierta";
import { LETRA } from "./estilos";

/** «Libros que comentan este episodio». Si la API no devuelve nada, no pinta nada. */
export function LibrosDelEpisodio({ episodioId }: { episodioId: string }) {
  const router = useRouter();
  const [libros, setLibros] = useState<RecomendacionLibro[]>([]);
  useEffect(() => {
    let vivo = true;
    void clienteLibrosApp(null, null).then(({ api }) => api.recomendaciones(episodioId)).then((dato) => {
      if (vivo) setLibros(dato);
    });
    return () => {
      vivo = false;
    };
  }, [episodioId]);
  if (libros.length === 0) return null;
  return (
    <View style={{ paddingHorizontal: 16, paddingBottom: 24, gap: 12 }}>
      <Text accessibilityRole="header" style={{ color: "#e0c48a", fontSize: 12, letterSpacing: 2, textTransform: "uppercase" }}>Libros que comentan este episodio</Text>
      {libros.map((libro) => (
        <Pressable key={libro.id} accessibilityRole="link" onPress={() => router.push(rutaDeRecomendacion(libro) as never)} style={{ flexDirection: "row", gap: 14, alignItems: "center", minHeight: 48 }}>
          <Cubierta volumen={libro.volumen} titulo={libro.titulo} ancho={52} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ color: "#f4ece2", fontFamily: LETRA, fontSize: 18, lineHeight: 22 }}>{libro.titulo}</Text>
            <Text style={{ color: "#b7ab9c", fontSize: 13 }}>{libro.subtitulo}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}
