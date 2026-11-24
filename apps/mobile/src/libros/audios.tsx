import { rotuloEpisodio, type PendingEpisode } from "@audite/domain";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Modal, Pressable, Text, View } from "react-native";
import { baseDeContenido } from "../entorno";
import { duracionCorta, infoEpisodio } from "../hoy";
import { tipoAcceso } from "../acceso";
import { Insignia } from "../ui/Insignia";
import { Icono } from "../ui/Icono";
import { ObraMarco } from "../ui/ObraMarco";
import { useReproducir } from "../ui/useReproducir";
import { useTema } from "../ui/tema";
import { useContextoCatalogo } from "../ui/useHoy";
import { audiosDelLibro, idDeLibroBiblico, type FilaAudio } from "./episodios-libro";
import { LETRA } from "./estilos";

export const ROTULO_AUDIOS = "Audios de este libro";

type Props = {
  visible: boolean;
  onCerrar: () => void;
  /** Nombre del libro bíblico de la estantería («Génesis») y, si se conoce, su id de la ficha. */
  libro: string;
  libroId?: string | null;
  destacados: readonly { episodio_id: string }[];
  fondo: string;
  tinta: string;
};

/** Hoja con los episodios de Audite del libro bíblico del volumen. Los destacados de la estantería van primero. */
export function HojaAudios({ visible, onCerrar, libro, libroId, destacados, fondo, tinta }: Props) {
  const { c, lang, library } = useTema();
  const ctx = useContextoCatalogo();
  const reproducir = useReproducir();
  const bookId = useMemo(() => idDeLibroBiblico(library.catalog.books, { libro_id: libroId, nombre: libro }), [library.catalog.books, libroId, libro]);
  const [remotos, setRemotos] = useState<{ libro: string; episodios: PendingEpisode[] } | null>(null);
  const hayLocales = bookId ? library.catalog.pendientes.some((e) => e.bookId === bookId) : true;

  useEffect(() => {
    if (!visible || !bookId || hayLocales) return;
    let vivo = true;
    void fetch(`${baseDeContenido()}/api/libro/${bookId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((dato: { episodios?: PendingEpisode[] } | null) => vivo && setRemotos({ libro: bookId, episodios: dato?.episodios ?? [] }))
      .catch(() => vivo && setRemotos({ libro: bookId, episodios: [] }));
    return () => {
      vivo = false;
    };
  }, [visible, bookId, hayLocales]);

  const filas = useMemo<FilaAudio[]>(() => {
    if (!bookId) return [];
    const extra = remotos?.libro === bookId ? remotos.episodios : [];
    return audiosDelLibro({ bookId, pendientes: hayLocales ? library.catalog.pendientes : extra, grabados: library.catalog.episodes, destacados });
  }, [bookId, hayLocales, remotos, library.catalog.pendientes, library.catalog.episodes, destacados]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCerrar} accessibilityViewIsModal>
      <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.55)" }}>
        <Pressable accessibilityLabel={`Cerrar ${ROTULO_AUDIOS.toLowerCase()}`} accessibilityRole="button" onPress={onCerrar} style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }} />
        <View style={{ maxHeight: "82%", minHeight: "45%", backgroundColor: c.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 10 }}>
          <View style={{ alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: c.line, marginBottom: 6 }} />
          <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 10, gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.muted, fontSize: 12, letterSpacing: 1.6, textTransform: "uppercase" }}>{libro}</Text>
              <Text accessibilityRole="header" style={{ color: c.ink, fontFamily: LETRA, fontSize: 26, lineHeight: 30 }}>{ROTULO_AUDIOS}</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={onCerrar} style={{ minHeight: 44, minWidth: 44, borderRadius: 22, backgroundColor: fondo, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: tinta, fontSize: 18 }}>✕</Text>
            </Pressable>
          </View>
          <FlatList
            data={filas}
            keyExtractor={(f) => f.id}
            contentContainerStyle={{ paddingBottom: 32, paddingTop: 4 }}
            initialNumToRender={8}
            ListEmptyComponent={<Text style={{ color: c.muted, fontSize: 16, lineHeight: 24, paddingHorizontal: 20, paddingVertical: 24 }}>Los audios de este libro se están preparando.</Text>}
            renderItem={({ item }) => {
              const info = infoEpisodio(item.id, { ...ctx, titulos: { ...ctx.titulos, ...(item.pendiente ? { [item.id]: item.pendiente.tituloCorto } : {}) } });
              const titulo = (item.pendiente ? rotuloEpisodio(item.pendiente, lang) : null) ?? info.titulo;
              const referencia = item.pendiente?.etiqueta?.[lang] || item.pendiente?.etiqueta?.es || info.capitulos || "";
              const meta = item.grabado ? duracionCorta(item.grabado.durationSeconds) : "";
              const actual = item.grabado?.id === ctx.actual;
              const puede = Boolean(item.grabado);
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${titulo}. ${referencia}`}
                  disabled={!puede}
                  onPress={() => {
                    onCerrar();
                    reproducir(item.id, { contexto: { tipo: "libro", id: bookId ?? item.id } });
                  }}
                  style={{ marginHorizontal: 16, marginBottom: 10, padding: 10, borderRadius: 20, flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: c.card, borderWidth: 1, borderColor: c.line, opacity: puede ? 1 : 0.7, minHeight: 64 }}
                >
                  <ObraMarco src={info.src} style={{ width: 64, height: 64, borderRadius: 14 }} desenfoque={12} />
                  <View style={{ flex: 1, gap: 3 }}>
                    {item.destacado ? <Text style={{ color: c.accent, fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase" }}>Destacado</Text> : null}
                    <Text numberOfLines={2} style={{ color: actual ? c.accent : c.ink, fontFamily: LETRA, fontSize: 18, lineHeight: 22 }}>{titulo}</Text>
                    <Text numberOfLines={1} style={{ color: c.muted, fontSize: 14 }}>{[referencia, meta].filter(Boolean).join(" · ")}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 6 }}>
                    {actual ? <Icono nombre="ondas" size={22} color={c.accent} /> : null}
                    <Insignia tipo={tipoAcceso(item.id, puede)} c={c} lang={lang} />
                  </View>
                </Pressable>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}
