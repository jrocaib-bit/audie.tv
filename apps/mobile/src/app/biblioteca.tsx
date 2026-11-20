import { booksOnTheWay, episodiosDeLibro, rotuloEpisodio, type PendingEpisode } from "@audite/domain";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlatList, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { baseDeContenido } from "../entorno";
import { infoEpisodio, duracionCorta } from "../hoy";
import { fonts } from "../theme";
import { tx } from "../textos";
import { Chip } from "../ui/Basicos";
import { Icono } from "../ui/Icono";
import { ObraMarco } from "../ui/ObraMarco";
import { Pulsable } from "../ui/Pulsable";
import { ScreenHeader } from "../ui/ScreenHeader";
import { useTema } from "../ui/tema";
import { useContextoCatalogo } from "../ui/useHoy";

export default function Biblioteca() {
  const { c, lang, library } = useTema();
  const t = tx(lang);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const ctx = useContextoCatalogo();
  const libros = useMemo(() => booksOnTheWay(library.catalog.books), [library.catalog.books]);
  const [abierto, setAbierto] = useState(libros.some((libro) => libro.id === "gn") ? "gn" : libros[0]?.id ?? "");
  const [remotos, setRemotos] = useState<{ libro: string; episodios: PendingEpisode[] } | null>(null);

  useEffect(() => {
    if (library.catalog.pendientes.some((episodio) => episodio.bookId === abierto)) return;
    let cancelado = false;
    void fetch(`${baseDeContenido()}/api/libro/${abierto}`)
      .then((respuesta) => (respuesta.ok ? respuesta.json() : null))
      .then((dato: { episodios?: PendingEpisode[] } | null) => {
        if (!cancelado) setRemotos({ libro: abierto, episodios: dato?.episodios ?? [] });
      })
      .catch(() => {
        if (!cancelado) setRemotos({ libro: abierto, episodios: [] });
      });
    return () => {
      cancelado = true;
    };
  }, [abierto, library.catalog.pendientes]);

  const episodios = useMemo(() => {
    const locales = episodiosDeLibro(library.catalog.pendientes, abierto);
    if (locales.length > 0) return locales;
    return remotos?.libro === abierto ? remotos.episodios : [];
  }, [abierto, library.catalog.pendientes, remotos]);
  const grabados = useMemo(() => new Map(library.catalog.episodes.map((e) => [e.id, e])), [library.catalog.episodes]);

  return (
    <FlatList
      data={episodios}
      keyExtractor={(episodio) => episodio.id}
      style={{ backgroundColor: c.bg }}
      contentContainerStyle={{ paddingBottom: 32 + insets.bottom }}
      initialNumToRender={10}
      windowSize={7}
      ListHeaderComponent={
        <View style={{ gap: 12, paddingBottom: 12 }}>
          <ScreenHeader c={c} titulo={t.biblioteca} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }}>
            {libros.map((libro) => (
              <Chip key={libro.id} c={c} texto={libro.name[lang] || libro.name.es} activo={libro.id === abierto} onPress={() => setAbierto(libro.id)} />
            ))}
          </ScrollView>
        </View>
      }
      renderItem={({ item }) => {
        const grabado = grabados.get(item.id);
        const info = infoEpisodio(item.id, { ...ctx, titulos: { ...ctx.titulos, [item.id]: item.tituloCorto } });
        const titulo = rotuloEpisodio(item, lang) ?? info.titulo;
        const meta = grabado ? duracionCorta(grabado.durationSeconds) : "";
        const abrir = grabado && grabado.id === ctx.cargado ? () => router.push("/ahora") : undefined;
        return (
          <Pulsable onPress={abrir} disabled={!abrir} label={titulo} escala={0.985} style={{ marginHorizontal: 20, marginBottom: 10, padding: 10, borderRadius: 20, flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: c.card, borderWidth: 1, borderColor: c.line }}>
            <ObraMarco src={info.src} style={{ width: 72, height: 72, borderRadius: 14 }} desenfoque={12} />
            <View style={{ flex: 1, gap: 3 }}>
              <Text numberOfLines={2} style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 20, lineHeight: 24 }}>{titulo}</Text>
              <Text numberOfLines={1} style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 14 }}>{[item.capitulos, meta].filter(Boolean).join(" · ")}</Text>
            </View>
            {grabado ? (
              <Icono nombre="play" size={20} color={c.accent} />
            ) : (
              <View style={{ paddingHorizontal: 10, minHeight: 26, borderRadius: 13, justifyContent: "center", borderWidth: 1, borderColor: c.line }}>
                <Text style={{ color: c.muted, fontFamily: fonts.medium, fontSize: 12 }}>{t.proximamente}</Text>
              </View>
            )}
          </Pulsable>
        );
      }}
    />
  );
}
