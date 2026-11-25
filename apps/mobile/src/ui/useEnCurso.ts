import { localIsoDate, parseAnotaciones, type AnotacionesLibro, type LibroFicha } from "@audite/domain";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { libroIdDeClave, librosEnCurso, retosEnCurso, tarjetasEnCurso, type InfoLibro, type TarjetaEnCurso } from "../hoy-empezados";
import { claveCache, leerCache } from "../libros/cache-swr";
import { useCatalogo, validarCatalogo, validarLibro } from "../libros/datos";
import { RETOS_APP } from "../retos-app";
import { modeloRetos } from "../temporadas";
import { useTema } from "./tema";

/** Para el título y el índice vale cualquier copia guardada, por vieja que sea. */
const SIN_CADUCIDAD = { fresco: 0, maximo: Number.MAX_SAFE_INTEGER };

type Lecturas = { lecturas: { libroId: string; anotaciones: AnotacionesLibro }[]; info: Record<string, InfoLibro> };

function infoDeFicha(f: Pick<LibroFicha, "slug" | "titulo" | "volumen" | "indice">): InfoLibro {
  return { slug: f.slug, titulo: f.titulo, volumen: typeof f.volumen === "number" ? f.volumen : null, indice: f.indice };
}

/** Lee del dispositivo las anotaciones de todos los libros y, de la caché, su título e índice. */
async function leerLecturas(): Promise<Lecturas> {
  try {
    const claves = (await AsyncStorage.getAllKeys()).filter((k) => libroIdDeClave(k) !== null);
    const pares = claves.length ? await AsyncStorage.multiGet(claves) : [];
    const lecturas = pares.flatMap(([clave, valor]) => {
      const libroId = libroIdDeClave(clave);
      if (!libroId || !valor) return [];
      try {
        return [{ libroId, anotaciones: parseAnotaciones(JSON.parse(valor), libroId) }];
      } catch {
        return [];
      }
    }).filter((l) => l.anotaciones.progreso);
    const info: Record<string, InfoLibro> = {};
    if (lecturas.length === 0) return { lecturas, info };
    const catalogo = await leerCache(AsyncStorage, claveCache("catalogo"), SIN_CADUCIDAD, validarCatalogo);
    for (const f of catalogo?.dato ?? []) {
      info[f.slug] = infoDeFicha(f);
      info[f.id] = info[f.slug];
    }
    await Promise.all(
      lecturas.map(async ({ libroId }) => {
        const libro = await leerCache(AsyncStorage, claveCache("libro", libroId), SIN_CADUCIDAD, validarLibro);
        if (libro) info[libroId] = infoDeFicha(libro.dato.ficha);
      }),
    );
    return { lecturas, info };
  } catch {
    return { lecturas: [], info: {} };
  }
}

/**
 * Libros y retos empezados y sin terminar, para la sección «En curso» de Hoy.
 * Los libros se releen cada vez que Hoy gana el foco (al volver del lector, por ejemplo).
 * Si un libro empezado no tiene título ni índice en la caché, se pide el catálogo.
 */
export function useEnCurso(): { tarjetas: TarjetaEnCurso[]; listo: boolean } {
  const { library, lang } = useTema();
  const [datos, setDatos] = useState<Lecturas | null>(null);

  useFocusEffect(
    useCallback(() => {
      let vivo = true;
      void leerLecturas().then((d) => {
        if (vivo) setDatos(d);
      });
      return () => {
        vivo = false;
      };
    }, []),
  );

  const faltaInfo = Boolean(datos?.lecturas.some((l) => !datos.info[l.libroId]));
  const catalogo = useCatalogo(faltaInfo);
  const hoyIso = localIsoDate(new Date());
  const { rangos } = library.catalog;

  const retos = useMemo(() => {
    const tarjetas = new Map(modeloRetos({ lang, hoyIso, progress: library.progress, rangos }).temporadas.map((t) => [t.id, t]));
    const base = RETOS_APP.map((r) => {
      const t = tarjetas.get(r.id);
      return { id: r.id, titulo: t?.titulo ?? (r.tituloCorto ?? r.titulo)[lang], src: t?.src ?? "", sinObra: t?.sinObra ?? Boolean(r.sinObra), pasos: r.pasos };
    });
    return retosEnCurso(base, library.progress);
  }, [hoyIso, lang, library.progress, rangos]);

  const libros = useMemo(() => {
    if (!datos) return [];
    const remoto = new Map<string, InfoLibro>();
    for (const f of catalogo.dato ?? []) {
      remoto.set(f.slug, infoDeFicha(f));
      remoto.set(f.id, infoDeFicha(f));
    }
    return librosEnCurso(datos.lecturas, (id) => datos.info[id] ?? remoto.get(id) ?? null);
  }, [catalogo.dato, datos]);

  const tarjetas = useMemo(() => tarjetasEnCurso(libros, retos), [libros, retos]);
  return { tarjetas, listo: datos !== null };
}
