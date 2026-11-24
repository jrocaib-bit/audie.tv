/** Datos de Libros para la app: caché persistente con stale-while-revalidate y precarga. */
import type { LibroCortado, LibroFicha, VolumenEstanteria } from "@audite/domain";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef, useState } from "react";
import { Image } from "react-native";
import { POLITICAS, cargarSwr, claveCache, leerMemoria, type PoliticaCache } from "./cache-swr";
import { clienteLibrosApp } from "./cliente";
import { baseContenido } from "./config";
import { cargarEstanteriaApp, leerVolumenes, urlCubierta, urlLomo } from "./estanteria-datos";

export type DatosLibro = { ficha: LibroFicha; lectura: LibroCortado | null };

const esObjeto = (x: unknown): x is Record<string, unknown> => Boolean(x) && typeof x === "object";

export function validarEstanteria(bruto: unknown): VolumenEstanteria[] | null {
  const lista = Array.isArray(bruto) ? leerVolumenes({ volumenes: bruto }) : [];
  return lista.length > 0 ? lista : null;
}

export function validarCatalogo(bruto: unknown): LibroFicha[] | null {
  if (!Array.isArray(bruto) || bruto.length === 0) return null;
  return bruto.every((l) => esObjeto(l) && typeof l.id === "string" && typeof l.slug === "string" && typeof l.titulo === "string") ? (bruto as LibroFicha[]) : null;
}

export function validarLibro(bruto: unknown): DatosLibro | null {
  if (!esObjeto(bruto) || !esObjeto(bruto.ficha)) return null;
  const f = bruto.ficha;
  if (typeof f.id !== "string" || typeof f.titulo !== "string" || !Array.isArray(f.indice)) return null;
  const lectura = esObjeto(bruto.lectura) && Array.isArray(bruto.lectura.capitulos) && Array.isArray(bruto.lectura.indice) ? (bruto.lectura as unknown as LibroCortado) : null;
  return { ficha: bruto.ficha as unknown as LibroFicha, lectura };
}

type Fuente<T> = { clave: string; politica: PoliticaCache; validar: (b: unknown) => T | null; traer: () => Promise<T | null> };

const fuenteEstanteria = (): Fuente<VolumenEstanteria[]> => ({
  clave: claveCache("estanteria"),
  politica: POLITICAS.estanteria,
  validar: validarEstanteria,
  traer: () => cargarEstanteriaApp(baseContenido()),
});
const fuenteCatalogo = (): Fuente<LibroFicha[]> => ({
  clave: claveCache("catalogo"),
  politica: POLITICAS.catalogo,
  validar: validarCatalogo,
  traer: async () => {
    const { api } = await clienteLibrosApp(null, null);
    return validarCatalogo((await api.catalogo()).libros);
  },
});
const fuenteLibro = (slug: string): Fuente<DatosLibro> => ({
  clave: claveCache("libro", slug),
  politica: POLITICAS.libro,
  validar: validarLibro,
  traer: async () => {
    const { api } = await clienteLibrosApp(null, null);
    return validarLibro(await api.libro(slug));
  },
});

export type EstadoDatos<T> = { dato: T | null; cargando: boolean; fallo: boolean };

/** Lee de memoria al instante, después del disco, y revalida con la red si el dato no está fresco. */
function useSwr<T>(fuente: Fuente<T>, activo = true): EstadoDatos<T> {
  const { clave } = fuente;
  const memoria = leerMemoria<T>(clave, fuente.politica);
  const [estado, setEstado] = useState<EstadoDatos<T>>({ dato: memoria?.dato ?? null, cargando: activo && !memoria, fallo: false });
  const ref = useRef(fuente);
  ref.current = fuente;
  useEffect(() => {
    if (!activo) return;
    let vivo = true;
    const f = ref.current;
    const previa = leerMemoria<T>(f.clave, f.politica);
    setEstado({ dato: previa?.dato ?? null, cargando: !previa, fallo: false });
    void cargarSwr({
      almacen: AsyncStorage,
      clave: f.clave,
      politica: f.politica,
      validar: f.validar,
      traer: f.traer,
      alDato: (l) => vivo && setEstado({ dato: l.dato, cargando: false, fallo: false }),
    }).then((r) => {
      if (vivo) setEstado({ dato: r.dato, cargando: false, fallo: r.dato === null });
    });
    return () => {
      vivo = false;
    };
  }, [clave, activo]);
  return estado;
}

export const useEstanteria = () => useSwr(fuenteEstanteria());
export const useCatalogo = (activo: boolean) => useSwr(fuenteCatalogo(), activo);
export const useLibro = (slug: string) => useSwr(fuenteLibro(slug));

/** Precarga la ficha y el adelanto de un libro: al tocar (onPressIn) la red trabaja durante el toque y la transición. */
export function precargarLibro(slug: string): void {
  const f = fuenteLibro(slug);
  if (leerMemoria(f.clave, f.politica)?.fresco) return;
  void cargarSwr({ almacen: AsyncStorage, clave: f.clave, politica: f.politica, validar: f.validar, traer: f.traer });
}

const precargadas = new Set<string>();
export function precargarImagen(url: string): void {
  if (precargadas.has(url)) return;
  precargadas.add(url);
  void Image.prefetch(url).catch(() => precargadas.delete(url));
}
export const precargarCubierta = (volumen: number) => precargarImagen(urlCubierta(baseContenido(), volumen));
export const precargarLomo = (volumen: number) => precargarImagen(urlLomo(baseContenido(), volumen));

/** El volumen de la estantería para un slug, desde memoria si ya se cargó. */
export function volumenEnMemoria(slug: string): VolumenEstanteria | null {
  return leerMemoria<VolumenEstanteria[]>(claveCache("estanteria"), POLITICAS.estanteria)?.dato.find((v) => v.id === slug) ?? null;
}
