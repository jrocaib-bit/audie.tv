"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import {
  altCubierta,
  archivoPortada,
  botonesFicha,
  etiquetaLomo,
  hrefEntrarParaLibros,
  type AccionFicha,
  type MockLibros,
  type VistaLector,
  type VolumenEstanteria,
} from "@audite/domain";
import { consultarVista, hayProgreso } from "@/lib/libros/acceso-cliente";
import { destinoAccion } from "@/lib/libros/landing";
import { TEXTOS_ESTANTERIA, verEpisodios } from "@/lib/libros/textos-estanteria";
import "./estanteria.css";

const SIZES_CUBIERTA = "(min-width: 768px) min(22vw, 320px), min(46vw, 190px)";
const EASING = "cubic-bezier(.2,.8,.2,1)";
const MS_ABRIR = 680;
const MS_CERRAR = 520;
const MS_DECODE_MAX = 500;
const FOCOS = 'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])';

const urlPortada = (archivo: string) => `/api/libros/portada/${archivo}`;

function fuentesCubierta(volumen: number) {
  const src = (formato: "avif" | "webp", ancho: 480 | 960) => urlPortada(archivoPortada("cubierta", volumen, formato, ancho));
  return {
    avif: `${src("avif", 480)} 480w, ${src("avif", 960)} 960w`,
    webp: `${src("webp", 480)} 480w, ${src("webp", 960)} 960w`,
    base: src("webp", 480),
  };
}

const precargadas = new Set<number>();
/** Precarga con las mismas fuentes que la ficha: un `picture` suelto elige el mismo candidato. */
function precargarCubierta(volumen: number) {
  if (typeof document === "undefined" || precargadas.has(volumen)) return;
  precargadas.add(volumen);
  const f = fuentesCubierta(volumen);
  const picture = document.createElement("picture");
  for (const [tipo, srcset] of [["image/avif", f.avif], ["image/webp", f.webp]] as const) {
    const source = document.createElement("source");
    source.type = tipo;
    source.srcset = srcset;
    source.sizes = SIZES_CUBIERTA;
    picture.appendChild(source);
  }
  const img = document.createElement("img");
  img.decoding = "async";
  img.src = f.base;
  picture.appendChild(img);
}

function reducido(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function actualizarUrl(id: string | null) {
  try {
    const url = new URL(window.location.href);
    if (id) url.searchParams.set("libro", id);
    else url.searchParams.delete("libro");
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  } catch {
    // Sin historial no se actualiza la URL y todo sigue funcionando.
  }
}

function visibleEnPantalla(rect: DOMRect): boolean {
  return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.right > 0 && rect.top < window.innerHeight && rect.left < window.innerWidth;
}

const mover = (x: number, y: number, z: number, escala: number, rx: number, ry: number) =>
  `translate3d(${x}px, ${y}px, 0) scale(${escala}) translateZ(${z}px) rotateX(${rx}deg) rotateY(${ry}deg)`;
const REPOSO_ESCENA = { rx: -4, ry: -82 };

/** Fotogramas de lomo a escena. Mismas funciones en cada uno para interpolar bien. */
function fotogramas(zona: HTMLElement, caja: HTMLElement, enlace: HTMLElement, alReves = false): Keyframe[] {
  const z = zona.getBoundingClientRect();
  const l = enlace.getBoundingClientRect();
  const dx = l.left + l.width / 2 - (z.left + z.width / 2);
  const dy = l.top + l.height / 2 - (z.top + z.height / 2);
  const ancho = zona.offsetWidth;
  const escala = l.height / caja.offsetHeight;
  const lista: Keyframe[] = [
    { transform: mover(dx, dy, -ancho / 2, escala, 0, 0), offset: 0 },
    { transform: mover(dx * 0.4, dy * 0.4, ancho * 0.32, (escala + 1) / 2 + 0.04, -2, -30), offset: 0.4 },
    { transform: mover(0, 0, 0, 1, REPOSO_ESCENA.rx, REPOSO_ESCENA.ry), offset: 1 },
  ];
  return alReves ? lista.reverse().map((f, i) => ({ ...f, offset: [0, 0.6, 1][i] })) : lista;
}

function PictureCubierta({ volumen, titulo, className, imgRef }: { volumen: number; titulo: string; className?: string; imgRef?: React.Ref<HTMLImageElement> }) {
  const f = fuentesCubierta(volumen);
  return (
    <picture>
      <source type="image/avif" srcSet={f.avif} sizes={SIZES_CUBIERTA} />
      <source type="image/webp" srcSet={f.webp} sizes={SIZES_CUBIERTA} />
      <img ref={imgRef} className={className} src={f.base} width={480} height={720} decoding="async" alt={altCubierta({ volumen, titulo })} />
    </picture>
  );
}

type PropsEscena = {
  lang: string;
  v: VolumenEstanteria;
  mock: MockLibros | null;
  vista: VistaLector | null;
  modo: "animado" | "directo";
  suave: boolean;
  fase: "abierto" | "cerrando";
  enlace: () => HTMLElement | null;
  onCerrar: () => void;
  onTerminado: () => void;
};

function Escena({ lang, v, mock, vista, modo, suave, fase, enlace, onCerrar, onTerminado }: PropsEscena) {
  const raiz = useRef<HTMLDivElement>(null);
  const fondo = useRef<HTMLDivElement>(null);
  const zona = useRef<HTMLDivElement>(null);
  const caja = useRef<HTMLDivElement>(null);
  const ficha = useRef<HTMLDivElement>(null);
  const titulo = useRef<HTMLHeadingElement>(null);
  const cubierta = useRef<HTMLImageElement>(null);
  const animaciones = useRef<Animation[]>([]);
  const animCaja = useRef<Animation | null>(null);
  const terminado = useRef(false);
  const [progreso] = useState(() => hayProgreso(v.id));
  const idTitulo = `est-titulo-${v.id}`;
  const botones = botonesFicha(vista, v.disponibilidad, { progreso });
  const sinLectura = v.disponibilidad !== "lectura";
  const rutaLeer = `/${lang}/libros/${v.id}/leer`;

  const terminar = useCallback(() => {
    if (terminado.current) return;
    terminado.current = true;
    onTerminado();
  }, [onTerminado]);

  // Apertura. El libro parte del hueco del lomo y espera, como mucho 500 ms, a que la cubierta esté decodificada.
  useLayoutEffect(() => {
    const el = { raiz: raiz.current, fondo: fondo.current, zona: zona.current, caja: caja.current, ficha: ficha.current };
    if (!el.raiz || !el.fondo || !el.zona || !el.ficha) return;
    const propias: Animation[] = [];
    let cancelado = false;
    const dar = (a: Animation) => {
      propias.push(a);
      animaciones.current.push(a);
      return a;
    };
    if (suave) {
      dar(el.raiz.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150, easing: "ease-out" }));
    } else if (modo === "directo" || !el.caja || !enlace()) {
      dar(el.fondo.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: "ease-out" }));
      dar(el.ficha.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, easing: "ease-out" }));
    } else {
      const caja3d = el.caja;
      const origen = enlace();
      if (origen) {
        caja3d.style.willChange = "transform";
        const animacion = dar(caja3d.animate(fotogramas(el.zona, caja3d, origen), { duration: MS_ABRIR, easing: EASING, fill: "both" }));
        animCaja.current = animacion;
        animacion.pause();
        const conjunto = [
          animacion,
          dar(el.ficha.animate([{ opacity: 0, transform: "translateY(14px)" }, { opacity: 1, transform: "none" }], { duration: 320, delay: MS_ABRIR * 0.45, easing: "ease-out", fill: "both" })),
        ];
        conjunto[1]?.pause();
        dar(el.fondo.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, easing: "ease-out" }));
        const imagen = cubierta.current;
        const decodificada = imagen ? imagen.decode().catch(() => undefined) : Promise.resolve();
        void Promise.race([decodificada, new Promise((resolver) => setTimeout(resolver, MS_DECODE_MAX))]).then(() => {
          if (cancelado) return;
          for (const a of conjunto) a.play();
        });
        animacion.addEventListener("finish", () => {
          if (cancelado || terminado.current) return;
          for (const a of conjunto) a.cancel();
          caja3d.style.willChange = "";
          animCaja.current = null;
        });
      }
    }
    return () => {
      cancelado = true;
      for (const a of propias) a.cancel();
      if (el.caja) el.caja.style.willChange = "";
    };
    // Solo al montar la escena.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cierre. Si el lomo se ve, el libro vuelve al hueco. Si no, solo se funde.
  useEffect(() => {
    if (fase !== "cerrando") return;
    const r = raiz.current;
    const c = caja.current;
    const origen = enlace();
    const alHueco = !suave && Boolean(c && zona.current && ficha.current && fondo.current && origen && visibleEnPantalla(origen.getBoundingClientRect()));
    if (alHueco && c && zona.current && ficha.current && fondo.current && origen) {
      c.style.willChange = "transform";
      const enCurso = animCaja.current;
      let animacion: Animation;
      if (enCurso && enCurso.playState !== "finished") {
        enCurso.reverse();
        animacion = enCurso;
      } else {
        for (const a of animaciones.current) a.cancel();
        animacion = c.animate(fotogramas(zona.current, c, origen, true), { duration: MS_CERRAR, easing: EASING, fill: "forwards" });
      }
      animacion.addEventListener("finish", terminar, { once: true });
      ficha.current.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: "ease-in", fill: "forwards" });
      fondo.current.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 380, delay: 120, easing: "ease-in", fill: "forwards" });
    } else if (r) {
      for (const a of animaciones.current) a.cancel();
      const salida = r.animate([{ opacity: 1 }, { opacity: 0 }], { duration: suave ? 150 : 200, easing: "ease-in", fill: "forwards" });
      salida.addEventListener("finish", terminar, { once: true });
    } else {
      terminar();
    }
    const seguro = setTimeout(terminar, MS_CERRAR + 600);
    return () => clearTimeout(seguro);
  }, [fase, suave, enlace, terminar]);

  // Foco, scroll y fondo inertes mientras la escena está abierta.
  useEffect(() => {
    const nodo = raiz.current;
    if (!nodo) return;
    const inertes: Element[] = [];
    for (const hijo of Array.from(document.body.children)) {
      if (hijo === nodo || ["SCRIPT", "STYLE", "LINK", "TEMPLATE"].includes(hijo.tagName) || hijo.hasAttribute("inert")) continue;
      hijo.setAttribute("inert", "");
      inertes.push(hijo);
    }
    const { overflow, paddingRight } = document.body.style;
    const barra = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (barra > 0) document.body.style.paddingRight = `${barra}px`;
    titulo.current?.focus({ preventScroll: true });
    return () => {
      for (const hijo of inertes) hijo.removeAttribute("inert");
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
    };
  }, []);

  function teclas(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      onCerrar();
      return;
    }
    if (e.key !== "Tab" || !raiz.current) return;
    const lista = Array.from(raiz.current.querySelectorAll<HTMLElement>(FOCOS));
    const primero = lista[0];
    const ultimo = lista[lista.length - 1];
    if (!primero || !ultimo) {
      e.preventDefault();
      return;
    }
    const activo = document.activeElement;
    if (e.shiftKey && (activo === primero || activo === titulo.current)) {
      e.preventDefault();
      ultimo.focus();
    } else if (!e.shiftKey && activo === ultimo) {
      e.preventDefault();
      primero.focus();
    }
  }

  function fuera(e: MouseEvent<HTMLDivElement>) {
    const objetivo = e.target as HTMLElement;
    if (objetivo.closest("[data-ficha], [data-libro3d], [data-accion='cerrar']")) return;
    onCerrar();
  }

  function destino(accion: AccionFicha): string {
    return destinoAccion(accion, lang, v.id, hrefEntrarParaLibros(lang, rutaLeer), mock);
  }

  const estilo = { "--color": v.color } as CSSProperties;
  const destacados = v.episodios_destacados;
  const nombres: Record<string, string> = { primario: "est-boton est-boton-primario", secundario: "est-boton est-boton-secundario", enlace: "est-enlace" };

  return (
    <div ref={raiz} role="dialog" aria-modal="true" aria-labelledby={idTitulo} data-escena="" data-estado={fase} data-volumen={v.id} data-suave={suave ? "" : undefined} className="est-escena" style={estilo} onKeyDown={teclas} onClick={fuera}>
      <div ref={fondo} className="est-fondo" aria-hidden="true" />
      <button type="button" data-accion="cerrar" aria-label={TEXTOS_ESTANTERIA.cerrarAria} className="est-cerrar" onClick={onCerrar}>{TEXTOS_ESTANTERIA.cerrar}</button>
      <div className="est-contenido">
        <div className="est-columna">
          <div ref={zona} className="est-zona" data-libro3d="">
            {suave ? (
              <PictureCubierta volumen={v.volumen} titulo={v.titulo} className="est-plana" imgRef={cubierta} />
            ) : (
              <div ref={caja} className="est-libro" data-caja="">
                <div className="est-cara est-lomo-cara">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={urlPortada(archivoPortada("lomo", v.volumen, "webp"))} width={120} height={1470} alt="" decoding="async" />
                </div>
                <div className="est-cara est-cubierta-cara"><PictureCubierta volumen={v.volumen} titulo={v.titulo} imgRef={cubierta} /></div>
                <div className="est-cara est-dorso-cara" />
                <div className="est-cara est-paginas-cara" />
                <div className="est-cara est-canto-sup" />
                <div className="est-cara est-canto-inf" />
              </div>
            )}
          </div>
          <div ref={ficha} data-ficha="" className="est-ficha">
            <p className="est-rotulo">{v.rotulo}</p>
            <h2 id={idTitulo} ref={titulo} tabIndex={-1} className="est-titulo">{v.titulo}</h2>
            <p className="est-subtitulo">{v.subtitulo}</p>
            <p className="est-sinopsis">{v.sinopsis}</p>
            {botones.length > 0 ? (
              <div className="est-acciones" data-acciones="">
                {botones.map((boton) => (
                  <Link key={boton.accion} href={destino(boton.accion)} data-accion={boton.accion} className={nombres[boton.nivel]}>{boton.etiqueta}</Link>
                ))}
              </div>
            ) : null}
            <p className="est-ver-libro"><Link href={`/${lang}/libros/${v.id}`} data-accion="ver-libro" className="est-enlace">{TEXTOS_ESTANTERIA.verLibro}</Link></p>
            {sinLectura ? (
              <div className="est-preparacion" data-aviso="en-preparacion">
                <span className="est-insignia">{TEXTOS_ESTANTERIA.enPreparacion}</span>
                <p>{TEXTOS_ESTANTERIA.frasePreparacion}</p>
              </div>
            ) : null}
            {destacados.length > 0 || v.episodios_total > 0 ? (
              <section className="est-episodios" aria-labelledby={`${idTitulo}-ep`}>
                <h3 id={`${idTitulo}-ep`}>{TEXTOS_ESTANTERIA.episodios}</h3>
                <ul>
                  {destacados.map((e) => (
                    <li key={e.episodio_id}>
                      <Link href={`/${lang}/catalogo/${e.episodio_id}`}>
                        <span className="est-ep-etiqueta">{e.etiqueta}</span>
                        <span>{e.titulo}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                {v.disponibilidad !== "borrador" && v.episodios_total > 0 ? (
                  <Link className="est-ver-todos" href={`/${lang}/libros/${v.id}#referencias`}>{verEpisodios(v.episodios_total)}</Link>
                ) : null}
              </section>
            ) : null}
            {v.credito_obra ? <p className="est-credito">{TEXTOS_ESTANTERIA.portada}{v.credito_obra}</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Estanteria({ lang, volumenes, mock, libroInicial }: { lang: string; volumenes: VolumenEstanteria[]; mock: MockLibros | null; libroInicial: string | null }) {
  const enlaces = useRef(new Map<string, HTMLAnchorElement>());
  const devolverFoco = useRef<string | null>(null);
  const inicial = libroInicial && volumenes.some((v) => v.id === libroInicial) ? libroInicial : null;
  const [abierto, setAbierto] = useState<{ id: string; modo: "animado" | "directo"; suave: boolean } | null>(inicial ? { id: inicial, modo: "directo", suave: false } : null);
  const [fase, setFase] = useState<"abierto" | "cerrando">("abierto");
  const [montado, setMontado] = useState(false);
  const [vista, setVista] = useState<VistaLector | null>(null);

  useEffect(() => {
    // Los portales y los atributos que dependen del navegador esperan al montaje.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMontado(true);
    setAbierto((actual) => (actual ? { ...actual, suave: reducido() } : actual));
  }, []);

  const volumenAbierto = abierto ? volumenes.find((v) => v.id === abierto.id) ?? null : null;
  const consultaAcceso = volumenAbierto?.disponibilidad === "lectura" ? volumenAbierto.id : null;

  // Estado de acceso, con el mismo mecanismo del lector. Hasta saberlo solo se ofrece el adelanto.
  useEffect(() => {
    if (!consultaAcceso) return;
    let vivo = true;
    void (async () => {
      const siguiente = await consultarVista(mock);
      if (vivo) setVista(siguiente);
    })();
    return () => {
      vivo = false;
    };
  }, [consultaAcceso, mock]);

  const abrir = useCallback((id: string) => {
    setAbierto((actual) => {
      if (actual) return actual;
      return { id, modo: "animado", suave: reducido() };
    });
    setFase("abierto");
    actualizarUrl(id);
  }, []);

  const cerrar = useCallback(() => {
    setFase((actual) => (actual === "abierto" ? "cerrando" : actual));
    actualizarUrl(null);
  }, []);

  const idAbierto = abierto?.id ?? null;
  const terminado = useCallback(() => {
    devolverFoco.current = idAbierto;
    setAbierto(null);
    setFase("abierto");
  }, [idAbierto]);

  useEffect(() => {
    if (abierto || !devolverFoco.current) return;
    enlaces.current.get(devolverFoco.current)?.focus({ preventScroll: true });
    devolverFoco.current = null;
  }, [abierto]);

  const enlaceAbierto = useCallback(() => (idAbierto ? (enlaces.current.get(idAbierto) ?? null) : null), [idAbierto]);

  function alPulsar(e: MouseEvent<HTMLAnchorElement>, id: string) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    abrir(id);
  }

  function teclasLista(e: KeyboardEvent<HTMLUListElement>) {
    const lista = volumenes.map((v) => enlaces.current.get(v.id)).filter((n): n is HTMLAnchorElement => Boolean(n));
    const actual = lista.findIndex((n) => n === document.activeElement);
    if (actual < 0) return;
    let destino = -1;
    if (e.key === "ArrowRight") destino = Math.min(lista.length - 1, actual + 1);
    else if (e.key === "ArrowLeft") destino = Math.max(0, actual - 1);
    else if (e.key === "Home") destino = 0;
    else if (e.key === "End") destino = lista.length - 1;
    if (destino < 0) return;
    e.preventDefault();
    lista[destino]?.focus();
  }

  return (
    <section data-estanteria="" className="est" aria-label={TEXTOS_ESTANTERIA.titulo}>
      <div className="est-balda">
        <div className="est-scroll">
          <div className="est-fila">
            <ul className="est-lomos" onKeyDown={teclasLista}>
              {volumenes.map((v) => (
                <li key={v.id} className="est-item" data-borrador={v.disponibilidad === "borrador" ? "" : undefined}>
                  <a
                    ref={(nodo) => {
                      if (nodo) enlaces.current.set(v.id, nodo);
                      else enlaces.current.delete(v.id);
                    }}
                    href={`/${lang}/libros/${v.id}`}
                    data-lomo={v.id}
                    aria-label={etiquetaLomo(v)}
                    className="est-lomo"
                    style={montado && abierto?.id === v.id ? { visibility: "hidden" } : undefined}
                    onClick={(e) => alPulsar(e, v.id)}
                    onKeyDown={(e) => {
                      if (e.key === " ") {
                        e.preventDefault();
                        abrir(v.id);
                      }
                    }}
                    onPointerEnter={() => precargarCubierta(v.volumen)}
                    onPointerDown={() => precargarCubierta(v.volumen)}
                    onFocus={() => precargarCubierta(v.volumen)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={urlPortada(archivoPortada("lomo", v.volumen, "webp"))} width={120} height={1470} alt="" loading="eager" decoding="async" />
                  </a>
                </li>
              ))}
            </ul>
            <div className="est-tabla" aria-hidden="true" />
          </div>
        </div>
        <div className="est-pista" aria-hidden="true" />
      </div>
      <p className="est-desliza">{TEXTOS_ESTANTERIA.desliza}</p>
      <p className="est-leyenda" data-leyenda="">{TEXTOS_ESTANTERIA.leyenda}</p>
      {montado && abierto && volumenAbierto
        ? createPortal(
            <Escena
              key={volumenAbierto.id}
              lang={lang}
              v={volumenAbierto}
              mock={mock}
              vista={vista}
              modo={abierto.modo}
              suave={abierto.suave}
              fase={fase}
              enlace={enlaceAbierto}
              onCerrar={cerrar}
              onTerminado={terminado}
            />,
            document.body,
          )
        : null}
    </section>
  );
}
