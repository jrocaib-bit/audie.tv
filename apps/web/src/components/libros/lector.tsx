"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  NOTA_MAX,
  anotacionesVacias,
  crearClienteLibros,
  fusionarAnotaciones,
  nuevoIdLibros,
  parseAnotaciones,
  rotuloCapitulo,
  vistaDeMock,
  type AnotacionesLibro,
  type CapituloLibro,
  type VistaLector,
} from "@audite/domain";
import { supabaseWeb } from "@/lib/auth-web";
import type { PropsLector } from "@/lib/libros/props-lector";
import { BloqueTexto } from "./bloque";
import { CorteLibro } from "./corte";
import "./libros.css";

type Tam = "sm" | "md" | "lg" | "xl";
type Tema = "noche" | "dia";
const TAMS: Tam[] = ["sm", "md", "lg", "xl"];
const CLAVE_AJUSTES = "audite.libros.ajustes.v1";
const claveLibro = (id: string) => `audite.libros.v1.${id}`;

type Seleccion = { bloque: string; inicio: number; fin: number };

function leerAjustes(): { tam: Tam; tema: Tema } {
  try {
    const dato = JSON.parse(localStorage.getItem(CLAVE_AJUSTES) ?? "null") as { tam?: string; tema?: string } | null;
    return { tam: TAMS.find((t) => t === dato?.tam) ?? "md", tema: dato?.tema === "dia" ? "dia" : "noche" };
  } catch {
    return { tam: "md", tema: "noche" };
  }
}

/** Desplazamiento dentro del texto del bloque a partir de un punto de la selección. */
function posicionEn(nodo: Node, offset: number, modo: "inicio" | "fin"): { bloque: string; pos: number } | null {
  const elemento = nodo.nodeType === 3 ? nodo.parentElement : (nodo as Element);
  const bloque = elemento?.closest("[data-bloque]");
  if (!bloque) return null;
  const id = bloque.getAttribute("data-bloque") ?? "";
  const trozo = nodo.nodeType === 3 ? elemento?.closest("[data-o]") : null;
  if (trozo) return { bloque: id, pos: Number(trozo.getAttribute("data-o")) + offset };
  return { bloque: id, pos: modo === "inicio" ? 0 : Number(bloque.getAttribute("data-largo") ?? 0) };
}

function seleccionActual(): Seleccion | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null;
  const rango = sel.getRangeAt(0);
  const ini = posicionEn(rango.startContainer, rango.startOffset, "inicio");
  const fin = posicionEn(rango.endContainer, rango.endOffset, "fin");
  if (!ini || !fin) return null;
  const largo = Number(document.querySelector(`[data-bloque="${CSS.escape(ini.bloque)}"]`)?.getAttribute("data-largo") ?? 0);
  const finPos = fin.bloque === ini.bloque ? fin.pos : largo;
  return finPos > ini.pos ? { bloque: ini.bloque, inicio: ini.pos, fin: finPos } : null;
}

export function Lector(props: PropsLector) {
  const { lang, libro, indice } = props;
  const [vista, setVista] = useState<VistaLector>(props.mock ? vistaDeMock(props.mock) : "sin-sesion");
  const [token, setToken] = useState<string | null>(null);
  const [cargados, setCargados] = useState<Record<string, CapituloLibro>>(() => Object.fromEntries(props.capitulos.map((c) => [c.id, c])));
  const [actual, setActual] = useState(props.capituloPedido ?? props.capituloInicial);
  const [sesionLista, setSesionLista] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);
  const [bloqueado, setBloqueado] = useState<string | null>(null);
  const [cargando, setCargando] = useState(Boolean(props.capituloPedido));
  const [ajustes, setAjustes] = useState<{ tam: Tam; tema: Tema }>({ tam: "md", tema: "noche" });
  const [panel, setPanel] = useState(false);
  const [anot, setAnot] = useState<AnotacionesLibro>(anotacionesVacias());
  const [activo, setActivo] = useState<{ bloque: string; subrayado: string | null } | null>(null);
  const [seleccion, setSeleccion] = useState<Seleccion | null>(null);
  const [escribiendo, setEscribiendo] = useState<{ bloque: string; subrayado: string | null } | null>(null);
  const [textoNota, setTextoNota] = useState("");
  const listo = useRef(false);
  const refAnot = useRef(anot);
  const refActual = useRef(actual);
  useEffect(() => {
    refAnot.current = anot;
    refActual.current = actual;
  }, [anot, actual]);

  const cliente = useMemo(() => crearClienteLibros({ base: "", token, mock: props.mock }), [token, props.mock]);
  const entrada = indice.find((e) => e.id === actual);
  const posicion = indice.findIndex((e) => e.id === actual);
  const siguiente = indice[posicion + 1] ?? null;
  const anterior = indice[posicion - 1] ?? null;
  const capitulo = cargados[actual] ?? null;
  const rutaLector = `/${lang}/libros/${libro.slug}/leer?c=${actual}${activo ? `&b=${activo.bloque}` : ""}`;

  // Ajustes y anotaciones del dispositivo.
  useEffect(() => {
    // Lectura de localStorage tras la hidratación: el servidor no puede conocerlo.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAjustes(leerAjustes());
    try {
      setAnot(parseAnotaciones(JSON.parse(localStorage.getItem(claveLibro(libro.id)) ?? "null"), libro.id));
    } catch {
      setAnot(anotacionesVacias());
    }
    listo.current = true;
  }, [libro.id]);

  const guardarLocal = useCallback((siguienteAnot: AnotacionesLibro) => {
    setAnot(siguienteAnot);
    try {
      localStorage.setItem(claveLibro(libro.id), JSON.stringify(siguienteAnot));
    } catch {
      // Sin almacenamiento: se lee igual, no se guarda.
    }
  }, [libro.id]);

  // Sesión: token de Supabase y vista (sin sesión, gratuito o premium).
  useEffect(() => {
    let vivo = true;
    void (async () => {
      const remoto = supabaseWeb();
      const sesion = remoto ? (await remoto.auth.getSession()).data.session : null;
      const t = sesion?.access_token ?? null;
      if (!vivo) return;
      setToken(t);
      if (t || props.mock) {
        const v = await crearClienteLibros({ base: "", token: t, mock: props.mock }).acceso();
        if (vivo) setVista(v);
      }
      if (vivo) setSesionLista(true);
    })();
    return () => {
      vivo = false;
    };
  }, [props.mock]);

  // Con sesión (o mock) se mezcla lo guardado en cuenta con lo del dispositivo y se sube lo que falte.
  useEffect(() => {
    if (!token && !props.mock) return;
    let vivo = true;
    void (async () => {
      const remoto = await cliente.leerAnotaciones(libro.id);
      if (!vivo || !remoto) return;
      const local = refAnot.current;
      const unido = fusionarAnotaciones(local, remoto);
      guardarLocal(unido);
      const falta = <T extends { id: string }>(a: T[], b: T[]) => a.filter((x) => !b.some((y) => y.id === x.id));
      for (const m of falta(local.marcadores, remoto.marcadores)) await cliente.crear(libro.id, "marcadores", m);
      for (const s of falta(local.subrayados, remoto.subrayados)) await cliente.crear(libro.id, "subrayados", s);
      for (const n of falta(local.notas, remoto.notas)) await cliente.crear(libro.id, "notas", n);
    })();
    return () => {
      vivo = false;
    };
  }, [cliente, token, props.mock, libro.id, guardarLocal]);

  const cambiarAjustes = (nuevos: { tam: Tam; tema: Tema }) => {
    setAjustes(nuevos);
    try {
      localStorage.setItem(CLAVE_AJUSTES, JSON.stringify(nuevos));
    } catch {
      // Sin almacenamiento.
    }
  };

  // Progreso: capítulo y bloque a la vista, y ratio de la página.
  const guardarProgreso = useCallback(() => {
    if (!listo.current) return;
    const bloques = [...document.querySelectorAll<HTMLElement>("[data-bloque]")];
    const visible = bloques.find((b) => b.getBoundingClientRect().bottom > 90);
    const alto = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = alto > 0 ? Math.min(1, Math.max(0, window.scrollY / alto)) : 0;
    const progreso = { libro_id: libro.id, capitulo_id: refActual.current, bloque_id: visible?.getAttribute("data-bloque") ?? null, ratio, updated_at: new Date().toISOString() };
    guardarLocal({ ...refAnot.current, progreso });
    if (token || props.mock) void cliente.guardarProgreso(libro.id, { capitulo_id: progreso.capitulo_id, bloque_id: progreso.bloque_id, ratio });
  }, [cliente, guardarLocal, libro.id, props.mock, token]);

  useEffect(() => {
    const alOcultar = () => {
      if (document.visibilityState === "hidden") guardarProgreso();
    };
    document.addEventListener("visibilitychange", alOcultar);
    window.addEventListener("pagehide", guardarProgreso);
    window.addEventListener("beforeunload", guardarProgreso);
    return () => {
      document.removeEventListener("visibilitychange", alOcultar);
      window.removeEventListener("pagehide", guardarProgreso);
      window.removeEventListener("beforeunload", guardarProgreso);
    };
  }, [guardarProgreso]);

  // Selección de texto para subrayar.
  useEffect(() => {
    const alCambiar = () => setSeleccion(seleccionActual());
    document.addEventListener("selectionchange", alCambiar);
    return () => document.removeEventListener("selectionchange", alCambiar);
  }, []);

  const irA = useCallback(async (id: string, bloque?: string | null) => {
    const destino = indice.find((e) => e.id === id);
    if (!destino) return;
    if (id !== refActual.current) guardarProgreso();
    setPanel(false);
    setActivo(null);
    setEscribiendo(null);
    setBloqueado(null);
    setFallo(null);
    setActual(id);
    window.history.replaceState(null, "", `/${lang}/libros/${libro.slug}/leer?c=${id}${props.mock ? `&mock=${props.mock}` : ""}`);
    const mover = () => {
      const objetivo = bloque ? document.getElementById(bloque) : null;
      if (objetivo) objetivo.scrollIntoView({ block: "center" });
      else window.scrollTo({ top: document.querySelector("[data-lector-cabecera]")?.getBoundingClientRect().top ?? 0 });
    };
    if (cargados[id]) {
      requestAnimationFrame(mover);
      return;
    }
    setCargando(true);
    const respuesta = await cliente.capitulo(libro.id, id);
    setCargando(false);
    if (respuesta.estado === "ok") {
      setCargados((previo) => ({ ...previo, [id]: respuesta.capitulo }));
      setTimeout(mover, 30);
    } else if (respuesta.estado === "sin-sesion" || respuesta.estado === "sin-permiso") {
      setBloqueado(id);
      if (respuesta.estado === "sin-permiso") setVista((v) => (v === "premium" ? v : "gratuito"));
      window.scrollTo({ top: 0 });
    } else {
      setFallo(id);
    }
  }, [cargados, cliente, guardarProgreso, indice, lang, libro.id, libro.slug, props.mock]);

  // Capítulo pedido por la URL que no es de adelanto, o progreso guardado: se pide una vez conocida la sesión.
  const pedidoInicial = useRef(false);
  useEffect(() => {
    if (pedidoInicial.current || !props.capituloPedido || !sesionLista) return;
    pedidoInicial.current = true;
    void irA(props.capituloPedido, props.bloqueInicial);
  }, [irA, sesionLista, props.capituloPedido, props.bloqueInicial]);

  useEffect(() => {
    if (props.capituloPedido || !props.bloqueInicial) return;
    const t = setTimeout(() => document.getElementById(props.bloqueInicial ?? "")?.scrollIntoView({ block: "center" }), 120);
    return () => clearTimeout(t);
  }, [props.capituloPedido, props.bloqueInicial]);

  // Anotaciones.
  const marcadores = anot.marcadores.filter((m) => m.capitulo_id === actual);
  const marcadorDeCapitulo = marcadores.find((m) => m.bloque_id === null);
  const sincronizar = (tipo: "marcadores" | "subrayados" | "notas", cuerpo: Record<string, unknown>) => {
    if (token || props.mock) void cliente.crear(libro.id, tipo, cuerpo);
  };
  const quitar = (tipo: "marcadores" | "subrayados" | "notas", id: string) => {
    if (token || props.mock) void cliente.borrar(libro.id, tipo, id);
  };

  const alternarMarcador = (bloque: string | null) => {
    const existente = anot.marcadores.find((m) => m.capitulo_id === actual && m.bloque_id === bloque);
    if (existente) {
      guardarLocal({ ...anot, marcadores: anot.marcadores.filter((m) => m.id !== existente.id) });
      quitar("marcadores", existente.id);
      return;
    }
    const nuevo = { id: nuevoIdLibros(), libro_id: libro.id, capitulo_id: actual, bloque_id: bloque, created_at: new Date().toISOString() };
    guardarLocal({ ...anot, marcadores: [...anot.marcadores, nuevo] });
    sincronizar("marcadores", nuevo);
  };

  const subrayar = () => {
    if (!seleccion) return;
    const nuevo = { id: nuevoIdLibros(), libro_id: libro.id, capitulo_id: actual, bloque_id: seleccion.bloque, inicio: seleccion.inicio, fin: seleccion.fin, color: "oro", created_at: new Date().toISOString() };
    guardarLocal({ ...anot, subrayados: [...anot.subrayados, nuevo] });
    sincronizar("subrayados", nuevo);
    window.getSelection()?.removeAllRanges();
    setSeleccion(null);
  };

  const quitarSubrayado = (id: string) => {
    guardarLocal({ ...anot, subrayados: anot.subrayados.filter((s) => s.id !== id), notas: anot.notas.map((n) => (n.subrayado_id === id ? { ...n, subrayado_id: null } : n)) });
    quitar("subrayados", id);
    setActivo(null);
  };

  const guardarNota = () => {
    const cuerpo = textoNota.trim().slice(0, NOTA_MAX);
    if (!cuerpo || !escribiendo) return;
    const nueva = { id: nuevoIdLibros(), libro_id: libro.id, capitulo_id: actual, bloque_id: escribiendo.bloque, subrayado_id: escribiendo.subrayado, texto: cuerpo, created_at: new Date().toISOString() };
    guardarLocal({ ...anot, notas: [...anot.notas, nueva] });
    sincronizar("notas", nueva);
    setTextoNota("");
    setEscribiendo(null);
    setActivo(null);
  };

  const borrarNota = (id: string) => {
    guardarLocal({ ...anot, notas: anot.notas.filter((n) => n.id !== id) });
    quitar("notas", id);
  };

  const finDeAdelanto = Boolean(capitulo) && vista !== "premium" && siguiente !== null && !siguiente.es_adelanto;
  const progresoGuardado = anot.progreso && anot.progreso.capitulo_id !== actual && indice.some((e) => e.id === anot.progreso?.capitulo_id) ? anot.progreso : null;

  const listaIndice = (
    <nav aria-label="Índice del libro" data-indice="">
      <ol className="grid gap-0.5">
        {indice.map((e) => {
          const cerrado = vista !== "premium" && !e.es_adelanto;
          return (
            <li key={e.id}>
              <button type="button" onClick={() => void irA(e.id)} aria-current={e.id === actual ? "true" : undefined} className={`flex min-h-11 w-full flex-col justify-center rounded-md px-3 text-left ${e.id === actual ? "bg-[var(--lector-tarjeta)] text-[var(--lector-acento)]" : ""}`}>
                <span className="text-[11px] tracking-[0.14em] text-[var(--lector-suave)] uppercase">{rotuloCapitulo(e)}{cerrado ? " · con suscripción" : ""}</span>
                <span className="text-[15px] leading-snug">{e.titulo}</span>
              </button>
            </li>
          );
        })}
      </ol>
      {anot.marcadores.length + anot.notas.length > 0 ? (
        <div className="mt-6 border-t border-[var(--lector-linea)] pt-4">
          <p className="px-3 text-[11px] tracking-[0.14em] text-[var(--lector-suave)] uppercase">Tus marcas</p>
          <ul className="mt-2 grid gap-0.5">
            {anot.marcadores.map((m) => (
              <li key={m.id}>
                <button type="button" onClick={() => void irA(m.capitulo_id, m.bloque_id)} className="min-h-11 w-full rounded-md px-3 text-left text-sm">Marcador · {indice.find((e) => e.id === m.capitulo_id)?.titulo ?? m.capitulo_id}</button>
              </li>
            ))}
            {anot.notas.map((n) => (
              <li key={n.id}>
                <button type="button" onClick={() => void irA(n.capitulo_id, n.bloque_id)} className="min-h-11 w-full rounded-md px-3 text-left text-sm">Nota · {n.texto.slice(0, 48)}</button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </nav>
  );

  const boton = "inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-[var(--lector-linea)] px-4 text-sm";

  return (
    <div className="lector min-h-dvh" data-lector="" data-vista={vista} data-tema={ajustes.tema} data-tam={ajustes.tam} data-capitulo={actual}>
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 pt-6 pb-40 md:px-8 lg:grid-cols-[260px_1fr] lg:gap-14">
        <aside className="hidden lg:block">
          <div className="sticky top-24 max-h-[calc(100dvh-8rem)] overflow-y-auto pr-2">
            <Link href={`/${lang}/libros/${libro.slug}`} className="mb-3 inline-flex min-h-11 items-center text-sm text-[var(--lector-acento)]">{libro.titulo}</Link>
            {listaIndice}
          </div>
        </aside>
        <div>
          <div className="flex flex-wrap items-center gap-2" role="toolbar" aria-label="Ajustes de lectura">
            <button type="button" className={`${boton} lg:hidden`} onClick={() => setPanel(true)} aria-haspopup="dialog">Índice</button>
            <Link href={`/${lang}/libros/${libro.slug}`} className={`${boton} lg:hidden`}>Ficha</Link>
            <span className="mx-1 hidden flex-1 lg:block" />
            <button type="button" className={boton} aria-label="Letra más pequeña" disabled={ajustes.tam === "sm"} onClick={() => cambiarAjustes({ ...ajustes, tam: TAMS[Math.max(0, TAMS.indexOf(ajustes.tam) - 1)] ?? "sm" })}>A−</button>
            <button type="button" className={boton} aria-label="Letra más grande" disabled={ajustes.tam === "xl"} onClick={() => cambiarAjustes({ ...ajustes, tam: TAMS[Math.min(TAMS.length - 1, TAMS.indexOf(ajustes.tam) + 1)] ?? "xl" })}>A+</button>
            <button type="button" className={boton} aria-pressed={ajustes.tema === "noche"} onClick={() => cambiarAjustes({ ...ajustes, tema: ajustes.tema === "noche" ? "dia" : "noche" })}>{ajustes.tema === "noche" ? "Día" : "Noche"}</button>
          </div>

          {progresoGuardado ? (
            <p className="mt-5 text-sm text-[var(--lector-suave)]">
              Dejaste la lectura en {indice.find((e) => e.id === progresoGuardado.capitulo_id)?.titulo}.{" "}
              <button type="button" className="min-h-11 text-[var(--lector-acento)] underline" onClick={() => void irA(progresoGuardado.capitulo_id, progresoGuardado.bloque_id)}>Seguir ahí</button>
            </p>
          ) : null}

          <header data-lector-cabecera="" className="mt-8 max-w-[65ch]">
            <p className="text-sm tracking-[0.16em] text-[var(--lector-acento)] uppercase">{entrada ? rotuloCapitulo(entrada) : libro.libro_biblico}</p>
            <h1 className="font-display mt-2 text-4xl leading-[1.02] md:text-6xl">{entrada?.titulo ?? libro.titulo}</h1>
            <p className="mt-2 text-sm text-[var(--lector-suave)]">{libro.titulo} · {libro.subtitulo}</p>
            <button type="button" className={`${boton} mt-4`} aria-pressed={Boolean(marcadorDeCapitulo)} data-accion="marcar-capitulo" {...(marcadorDeCapitulo ? { "data-marcador": marcadorDeCapitulo.id } : {})} onClick={() => alternarMarcador(null)}>
              {marcadorDeCapitulo ? "Capítulo marcado" : "Marcar capítulo"}
            </button>
          </header>

          {cargando ? <p className="mt-10 text-[var(--lector-suave)]" role="status">Abriendo el capítulo…</p> : null}
          {fallo === actual ? (
            <p className="mt-10 max-w-[65ch] text-[var(--lector-suave)]" role="alert">
              No se ha podido abrir este capítulo ahora.{" "}
              <button type="button" className="min-h-11 text-[var(--lector-acento)] underline" onClick={() => void irA(actual)}>Probar de nuevo</button>
            </p>
          ) : null}

          {bloqueado === actual ? (
            <CorteLibro lang={lang} vista={vista} rutaLector={rutaLector} tipo="capitulo" />
          ) : capitulo ? (
            <article key={actual} data-capitulo={capitulo.id} className="lector-cuerpo lector-aparece mt-8">
              {capitulo.bloques.map((bloque) => (
                <BloqueTexto
                  key={bloque.id}
                  lang={lang}
                  bloque={bloque}
                  subrayados={anot.subrayados.filter((s) => s.bloque_id === bloque.id)}
                  notas={anot.notas.filter((n) => n.bloque_id === bloque.id)}
                  marcado={marcadores.some((m) => m.bloque_id === bloque.id)}
                  activo={activo?.bloque === bloque.id}
                  rutaVuelta={`/${lang}/libros/${libro.slug}/leer?c=${actual}&b=${bloque.id}`}
                  onActivar={(id, sub) => setActivo(activo?.bloque === id && activo.subrayado === sub ? null : { bloque: id, subrayado: sub })}
                />
              ))}
            </article>
          ) : null}

          {finDeAdelanto && bloqueado !== actual ? <CorteLibro lang={lang} vista={vista} rutaLector={rutaLector} tipo="fin-adelanto" /> : null}

          {capitulo && bloqueado !== actual ? (
            <nav className="mt-12 flex max-w-[65ch] items-stretch justify-between gap-3" aria-label="Capítulos">
              {anterior ? <button type="button" className={`${boton} flex-1 justify-start text-left`} onClick={() => void irA(anterior.id)}>← {anterior.titulo}</button> : <span className="flex-1" />}
              {siguiente && !finDeAdelanto ? <button type="button" className={`${boton} flex-1 justify-end text-right`} onClick={() => void irA(siguiente.id)}>{siguiente.titulo} →</button> : <span className="flex-1" />}
            </nav>
          ) : null}
        </div>
      </div>

      {panel ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Índice del libro">
          <button type="button" aria-label="Cerrar el índice" className="absolute inset-0 bg-black/60" onClick={() => setPanel(false)} />
          <div className="lector lector-cajon absolute inset-x-0 bottom-0 max-h-[78dvh] overflow-y-auto rounded-t-3xl border-t border-[var(--lector-linea)] bg-[var(--lector-fondo)] px-4 pt-4 pb-10" data-tema={ajustes.tema}>
            <div className="mb-3 flex items-center justify-between px-3">
              <p className="font-display text-2xl">Índice</p>
              <button type="button" className={boton} onClick={() => setPanel(false)}>Cerrar</button>
            </div>
            {listaIndice}
          </div>
        </div>
      ) : null}

      {(seleccion || activo) && bloqueado !== actual ? (
        <div className="lector-cajon fixed inset-x-0 bottom-0 z-40 border-t border-[var(--lector-linea)] bg-[var(--lector-tarjeta)] px-4 py-3" role="region" aria-label="Acciones del texto" data-barra="">
          {escribiendo ? (
            <div className="mx-auto grid max-w-xl gap-2">
              <label className="text-sm text-[var(--lector-suave)]" htmlFor="texto-nota">Nota</label>
              <textarea id="texto-nota" value={textoNota} maxLength={NOTA_MAX} onChange={(e) => setTextoNota(e.target.value)} rows={3} autoFocus className="rounded-lg border border-[var(--lector-linea)] bg-transparent p-3 text-base" />
              <div className="flex gap-2">
                <button type="button" className={`${boton} bg-[#C9A96E] text-[#100E0C]`} onClick={guardarNota}>Guardar nota</button>
                <button type="button" className={boton} onClick={() => { setEscribiendo(null); setTextoNota(""); }}>Cancelar</button>
              </div>
            </div>
          ) : (
            <div className="mx-auto flex max-w-xl flex-wrap items-center gap-2" onMouseDown={(e) => e.preventDefault()}>
              {seleccion ? (
                <>
                  <button type="button" className={`${boton} bg-[#C9A96E] text-[#100E0C]`} data-accion="subrayar" onClick={subrayar}>Subrayar</button>
                  <button type="button" className={boton} onClick={() => { subrayarYNota(); }}>Subrayar y anotar</button>
                </>
              ) : activo ? (
                <>
                  <button type="button" className={boton} data-accion="marcar-bloque" onClick={() => alternarMarcador(activo.bloque)}>{marcadores.some((m) => m.bloque_id === activo.bloque) ? "Quitar marcador" : "Marcar"}</button>
                  <button type="button" className={boton} data-accion="nota" onClick={() => setEscribiendo({ bloque: activo.bloque, subrayado: activo.subrayado })}>Anotar</button>
                  {activo.subrayado ? <button type="button" className={boton} onClick={() => quitarSubrayado(activo.subrayado as string)}>Quitar subrayado</button> : null}
                  {anot.notas.filter((n) => n.bloque_id === activo.bloque).map((n) => (
                    <button key={n.id} type="button" className={boton} onClick={() => borrarNota(n.id)}>Borrar nota</button>
                  ))}
                  <button type="button" className={boton} onClick={() => setActivo(null)}>Cerrar</button>
                </>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );

  function subrayarYNota() {
    if (!seleccion) return;
    const nuevo = { id: nuevoIdLibros(), libro_id: libro.id, capitulo_id: actual, bloque_id: seleccion.bloque, inicio: seleccion.inicio, fin: seleccion.fin, color: "oro", created_at: new Date().toISOString() };
    guardarLocal({ ...anot, subrayados: [...anot.subrayados, nuevo] });
    sincronizar("subrayados", nuevo);
    window.getSelection()?.removeAllRanges();
    setSeleccion(null);
    setActivo({ bloque: nuevo.bloque_id, subrayado: nuevo.id });
    setEscribiendo({ bloque: nuevo.bloque_id, subrayado: nuevo.id });
  }
}
