/** @vitest-environment jsdom */
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { botonesFicha, etiquetaLomo, ETIQUETAS_FICHA, FRASE_EN_PREPARACION, LEYENDA_ESTANTERIA, type VolumenEstanteria } from "@audite/domain";
import { TEXTOS_ESTANTERIA, verEpisodios } from "@/lib/libros/textos-estanteria";
import { Estanteria } from "./estanteria";

vi.mock("@/lib/auth-web", () => ({ supabaseWeb: () => null }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...resto }: { href: string; children: React.ReactNode } & Record<string, unknown>) => <a href={href} {...resto}>{children}</a>,
}));

const TEXTO_CAPITULO = "TEXTO_PREMIUM_CAPITULO_PRUEBA_XYZ";
const volumenes: VolumenEstanteria[] = Array.from({ length: 16 }, (_, i) => ({
  volumen: i + 1,
  id: `libro-${i + 1}`,
  libro: `Libro ${i + 1}`,
  titulo: `Título inventado ${i + 1}`,
  subtitulo: "Subtítulo inventado",
  rotulo: `LIBRO ${i + 1} · VOL. ${i + 1}`,
  color: "#805F36",
  sinopsis: "Una sinopsis inventada. Dos frases de prueba.",
  credito_obra: "Autor inventado, obra inventada, 1500 a 1510. Dominio público.",
  borrador: i >= 10,
  episodios_total: i === 4 ? 12 : 5,
  episodios_destacados: [
    { episodio_id: `ep-${i + 1}-a`, etiqueta: "Libro 1 a 2", titulo: "Episodio a" },
    { episodio_id: `ep-${i + 1}-b`, etiqueta: "Libro 3", titulo: "Episodio b" },
  ],
  disponibilidad: i >= 10 ? "borrador" : "lectura",
}));

const props = { lang: "es", volumenes, mock: null, libroInicial: null } as const;

describe("estantería, render en servidor", () => {
  const html = renderToStaticMarkup(<Estanteria {...props} />);

  it("16 enlaces con aria-label, a la ficha existente, con el lomo como imagen vacía de alt", () => {
    const enlaces = [...html.matchAll(/<a [^>]*data-lomo="([^"]+)"[^>]*>/g)];
    expect(enlaces).toHaveLength(16);
    expect(html).toContain('href="/es/libros/libro-3"');
    expect(html).toContain(`aria-label="${etiquetaLomo(volumenes[2]!)}"`);
    expect(html).toContain('aria-label="Volumen 3, Título inventado 3, Libro 3. Abrir ficha"');
    const lomos = [...html.matchAll(/<img [^>]*>/g)].map((m) => m[0]);
    expect(lomos).toHaveLength(16);
    for (const img of lomos) {
      expect(img).toContain('alt=""');
      expect(img).toContain('width="120"');
      expect(img).toContain('height="1470"');
      expect(img).toContain('loading="eager"');
      expect(img).toContain("/api/libros/portada/lomo-");
    }
    expect(html).toContain("data-estanteria");
  });

  it("en reposo no hay imagen de cubierta ni diálogo, ni texto de capítulos", () => {
    expect(html).not.toContain("cubierta-");
    expect(html).not.toContain("<picture");
    expect(html).not.toContain('role="dialog"');
    expect(html).not.toContain(TEXTO_CAPITULO);
  });

  it("lleva la leyenda y la pista de desliz", () => {
    expect(html).toContain(LEYENDA_ESTANTERIA);
    expect(html).toContain("Desliza para ver los 16 volúmenes");
  });
});

beforeEach(() => {
  HTMLElement.prototype.animate = function () {
    return { pause() {}, play() {}, cancel() {}, reverse() {}, playState: "finished", addEventListener: (_: string, cb: () => void) => void setTimeout(cb, 0) } as unknown as Animation;
  };
  HTMLImageElement.prototype.decode = () => Promise.resolve();
});

describe("estilo de las cadenas de interfaz", () => {
  const cadenas = [
    ...Object.values(TEXTOS_ESTANTERIA),
    verEpisodios(1),
    verEpisodios(12),
    LEYENDA_ESTANTERIA,
    FRASE_EN_PREPARACION,
    ...Object.values(ETIQUETAS_FICHA),
    etiquetaLomo(volumenes[0]!),
  ];

  it("sin punto y coma, rayas ni construcciones prohibidas", () => {
    for (const cadena of cadenas) {
      expect(cadena, cadena).not.toMatch(/[;—–]/);
      expect(cadena, cadena).not.toMatch(/\bno es\b|\bsino\b|\bCEE\b|Gazpacho|SF Pro/i);
    }
  });

  it("el HTML de la escena abierta tampoco las lleva en sus textos", () => {
    const { baseElement } = render(<Estanteria {...props} libroInicial="libro-1" />);
    const texto = document.body.textContent ?? "";
    expect(texto).not.toMatch(/[;—–]/);
    expect(baseElement).toBeTruthy();
    cleanup();
  });
});

describe("estantería, interacción", () => {
  let animaciones = 0;
  beforeEach(() => {
    animaciones = 0;
    window.matchMedia = ((q: string) => ({ matches: q.includes("reduce") && reducir, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as typeof window.matchMedia;
    HTMLElement.prototype.animate = function () {
      animaciones += 1;
      return { pause() {}, play() {}, cancel() {}, reverse() {}, playState: "finished", addEventListener: (_: string, cb: () => void) => void setTimeout(cb, 0) } as unknown as Animation;
    };
    HTMLImageElement.prototype.decode = () => Promise.resolve();
    window.history.replaceState(null, "", "/es/libros");
  });
  afterEach(() => {
    cleanup();
    reducir = false;
    document.body.removeAttribute("style");
  });
  let reducir = false;

  const lomo = (id: string) => document.querySelector<HTMLAnchorElement>(`[data-lomo="${id}"]`)!;
  const esperar = () => act(async () => { await new Promise((r) => setTimeout(r, 20)); });

  it("clic abre la escena con el diálogo accesible, bloquea el fondo y pone la URL", async () => {
    render(<Estanteria {...props} />);
    await act(async () => { fireEvent.click(lomo("libro-3")); });
    const dialogo = document.querySelector<HTMLElement>("[data-escena]")!;
    expect(dialogo.getAttribute("role")).toBe("dialog");
    expect(dialogo.getAttribute("aria-modal")).toBe("true");
    expect(dialogo.getAttribute("data-estado")).toBe("abierto");
    const titulo = document.getElementById(dialogo.getAttribute("aria-labelledby")!)!;
    expect(titulo.textContent).toBe("Título inventado 3");
    expect(document.activeElement).toBe(titulo);
    expect(document.body.style.overflow).toBe("hidden");
    expect(lomo("libro-3").style.visibility).toBe("hidden");
    expect(window.location.search).toBe("?libro=libro-3");
    expect(document.querySelector("[data-ficha] img, picture img")?.getAttribute("alt")).toContain("Cubierta de «Título inventado 3», volumen 3");
    expect(document.querySelector('[data-accion="leer"]')?.getAttribute("href")).toBe("/es/libros/libro-3/leer");
    await esperar();
    expect(document.querySelector('[data-accion="entrar"]')).not.toBeNull();
    expect(document.querySelector('[data-accion="prueba"]')?.getAttribute("href")).toBe("/es/membresia");
    expect(animaciones).toBeGreaterThan(0);
  });

  it("Esc cierra y el foco vuelve al lomo, con la URL limpia y el lomo visible", async () => {
    render(<Estanteria {...props} />);
    lomo("libro-3").focus();
    await act(async () => { fireEvent.click(lomo("libro-3")); });
    await act(async () => { fireEvent.keyDown(document.querySelector("[data-escena]")!, { key: "Escape" }); });
    expect(document.querySelector("[data-escena]")?.getAttribute("data-estado")).toBe("cerrando");
    await esperar();
    expect(document.querySelector("[data-escena]")).toBeNull();
    expect(document.activeElement).toBe(lomo("libro-3"));
    expect(lomo("libro-3").style.visibility).toBe("");
    expect(window.location.search).toBe("");
    expect(document.body.style.overflow).toBe("");
  });

  it("el botón Cerrar y el clic en el fondo cierran, un clic dentro de la ficha no", async () => {
    render(<Estanteria {...props} />);
    await act(async () => { fireEvent.click(lomo("libro-2")); });
    await act(async () => { fireEvent.click(document.querySelector("[data-ficha]")!); });
    expect(document.querySelector("[data-escena]")?.getAttribute("data-estado")).toBe("abierto");
    await act(async () => { fireEvent.click(document.querySelector(".est-fondo")!); });
    await esperar();
    expect(document.querySelector("[data-escena]")).toBeNull();
    await act(async () => { fireEvent.click(lomo("libro-2")); });
    const cerrar = document.querySelector<HTMLElement>('[data-accion="cerrar"]')!;
    expect(cerrar.getAttribute("aria-label")).toBeTruthy();
    await act(async () => { fireEvent.click(cerrar); });
    await esperar();
    expect(document.querySelector("[data-escena]")).toBeNull();
  });

  it("la trampa de foco da la vuelta y el resto de la página queda inerte", async () => {
    const { container } = render(<div data-pagina><Estanteria {...props} /></div>);
    await act(async () => { fireEvent.click(lomo("libro-1")); });
    expect(container.hasAttribute("inert")).toBe(true);
    const focos = [...document.querySelectorAll<HTMLElement>("[data-escena] a[href], [data-escena] button")];
    const ultimo = focos[focos.length - 1]!;
    ultimo.focus();
    await act(async () => { fireEvent.keyDown(document.querySelector("[data-escena]")!, { key: "Tab" }); });
    expect(document.activeElement).toBe(document.querySelector('[data-accion="cerrar"]') ?? focos[0]);
    await act(async () => { fireEvent.keyDown(document.querySelector("[data-escena]")!, { key: "Escape" }); });
    await esperar();
    expect(container.hasAttribute("inert")).toBe(false);
  });

  it("flechas, Inicio y Fin mueven el foco entre lomos", async () => {
    render(<Estanteria {...props} />);
    lomo("libro-5").focus();
    fireEvent.keyDown(lomo("libro-5"), { key: "ArrowRight" });
    expect(document.activeElement).toBe(lomo("libro-6"));
    fireEvent.keyDown(lomo("libro-6"), { key: "ArrowLeft" });
    fireEvent.keyDown(lomo("libro-5"), { key: "ArrowLeft" });
    expect(document.activeElement).toBe(lomo("libro-4"));
    fireEvent.keyDown(lomo("libro-4"), { key: "End" });
    expect(document.activeElement).toBe(lomo("libro-16"));
    fireEvent.keyDown(lomo("libro-16"), { key: "Home" });
    expect(document.activeElement).toBe(lomo("libro-1"));
  });

  it("un borrador muestra la insignia, la sinopsis y los episodios, sin botón de lectura y con enlace a la landing", async () => {
    render(<Estanteria {...props} />);
    await act(async () => { fireEvent.click(lomo("libro-12")); });
    await esperar();
    const ficha = document.querySelector("[data-ficha]")!;
    expect(ficha.textContent).toContain("En preparación");
    expect(ficha.textContent).toContain("Una sinopsis inventada");
    expect([...ficha.querySelectorAll("[data-accion]")].map((a) => a.getAttribute("data-accion"))).toEqual(["ver-libro"]);
    expect(ficha.querySelector('[data-accion="ver-libro"]')?.getAttribute("href")).toBe("/es/libros/libro-12");
    expect(ficha.querySelectorAll('a[href^="/es/catalogo/ep-12-"]')).toHaveLength(2);
    expect(ficha.querySelector('a[href*="#referencias"]')).toBeNull();
    expect(ficha.textContent).toContain("Libro 1 a 2");
  });

  it("los episodios y el crédito salen en la ficha de un libro con lectura", async () => {
    render(<Estanteria {...props} />);
    await act(async () => { fireEvent.click(lomo("libro-5")); });
    const ficha = document.querySelector("[data-ficha]")!;
    expect(ficha.querySelector('a[href="/es/catalogo/ep-5-a"]')?.textContent).toContain("Libro 1 a 2");
    expect(ficha.querySelector('a[href="/es/libros/libro-5#referencias"]')?.textContent).toBe("Ver los 12 episodios del libro");
    const ver = ficha.querySelector('a[data-accion="ver-libro"]');
    expect(ver?.getAttribute("href")).toBe("/es/libros/libro-5");
    expect(ver?.textContent).toBe("Ver el libro");
    expect(ficha.textContent).toContain("Portada: Autor inventado");
  });

  it("el mock se reenvía a la API de acceso y se añade al enlace de leer", async () => {
    const llamadas: { url: string; mock: string | null }[] = [];
    vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
      llamadas.push({ url, mock: new Headers(init?.headers).get("x-libros-mock") });
      return new Response(JSON.stringify({ vista: "premium" }), { status: 200 });
    });
    render(<Estanteria {...props} mock="premium" />);
    await act(async () => { fireEvent.click(lomo("libro-1")); });
    await esperar();
    expect(llamadas).toEqual([{ url: "/api/libros/acceso", mock: "premium" }]);
    const leer = document.querySelector('[data-accion="leer"]')!;
    expect(leer.textContent).toBe("Leer");
    expect(leer.getAttribute("href")).toBe("/es/libros/libro-1/leer?mock=premium");
    expect(document.querySelector('[data-accion="prueba"], [data-accion="premium"], [data-accion="entrar"]')).toBeNull();
    vi.unstubAllGlobals();
  });

  it("con prefers-reduced-motion se muestra la cubierta plana sin caja 3D", async () => {
    reducir = true;
    render(<Estanteria {...props} />);
    await act(async () => { fireEvent.click(lomo("libro-1")); });
    expect(document.querySelector("[data-caja]")).toBeNull();
    expect(document.querySelector("picture img.est-plana")).not.toBeNull();
  });

  it("con animación se monta la caja 3D con sus seis caras y una cubierta AVIF y WebP de 480 y 960", async () => {
    render(<Estanteria {...props} />);
    await act(async () => { fireEvent.click(lomo("libro-1")); });
    expect(document.querySelectorAll("[data-caja] > .est-cara")).toHaveLength(6);
    const fuentes = [...document.querySelectorAll("[data-caja] source")];
    expect(fuentes.map((s) => s.getAttribute("type"))).toEqual(["image/avif", "image/webp"]);
    expect(fuentes[0]?.getAttribute("srcset")).toBe("/api/libros/portada/cubierta-01-480.avif 480w, /api/libros/portada/cubierta-01-960.avif 960w");
    expect(document.querySelectorAll("[data-caja] img")).toHaveLength(2);
  });

  it("el enlace profundo abre la escena directamente", async () => {
    render(<Estanteria {...props} libroInicial="libro-7" />);
    await esperar();
    expect(document.querySelector("[data-escena]")?.getAttribute("data-volumen")).toBe("libro-7");
    expect(document.querySelector("[data-escena]")?.getAttribute("data-estado")).toBe("abierto");
  });

  it("un libro desconocido en ?libro= se ignora", async () => {
    render(<Estanteria {...props} libroInicial="no-existe" />);
    await esperar();
    expect(document.querySelector("[data-escena]")).toBeNull();
  });
});

describe("botones en la ficha según el catálogo", () => {
  it("coinciden con la función pura", () => {
    expect(botonesFicha("sin-sesion", "lectura").map((b) => b.accion)).toEqual(["leer", "prueba", "entrar"]);
  });
});
