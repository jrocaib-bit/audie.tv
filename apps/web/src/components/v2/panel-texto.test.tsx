/** @vitest-environment jsdom */
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CLAVE_TEXTO_MODO, CLAVE_TEXTO_TAMANO, PALETA_TEXTO, TAMANOS_TEXTO, type TextoEpisodio } from "@audite/domain";
import { ratioContraste } from "@/lib/contraste";
import { PanelTexto, PanelTextoVista } from "./panel-texto";

// Texto inventado para las pruebas. No es ninguna edición bíblica.
const sincronizado: TextoEpisodio = {
  version: 1,
  episodio: "gn-01",
  idioma: "es",
  muestra: true,
  fuente: "Fuente inventada",
  credito: "Crédito inventado para la prueba",
  versiculos: [
    { ref: "1,1", cap: 1, v: "1", texto: "Primera frase inventada.", t: 0 },
    { ref: "1,2", cap: 1, v: "2", texto: "Segunda frase inventada.", t: 10 },
    { ref: "1,3", cap: 1, v: "3", texto: "Tercera frase inventada.", t: 20 },
    { ref: "1,4", cap: 1, v: "4", texto: "Cuarta frase inventada.", t: 30 },
    { ref: "1,5a", cap: 1, v: "5a", texto: "Quinta frase inventada.", t: 40 },
  ],
};
const sinTiempos: TextoEpisodio = { ...sincronizado, episodio: "gn-02", versiculos: sincronizado.versiculos.map(({ t: _t, ...resto }) => resto) };

let desplazamientos: ScrollToOptions[] = [];

function medio(reduce: boolean) {
  vi.stubGlobal("matchMedia", () => ({ matches: reduce, media: "", addEventListener: () => undefined, removeEventListener: () => undefined, addListener: () => undefined, removeListener: () => undefined, dispatchEvent: () => false }));
}

function vista(props: Partial<Parameters<typeof PanelTextoVista>[0]> = {}) {
  const onSaltar = vi.fn();
  const resultado = render(<PanelTextoVista carga={{ tipo: "listo", texto: sincronizado }} uiLocale="es" tiempo={12} onSaltar={onSaltar} reducirMovimiento={false} {...props} />);
  return { ...resultado, onSaltar };
}

beforeEach(() => {
  localStorage.clear();
  desplazamientos = [];
  HTMLElement.prototype.scrollTo = function (opciones?: ScrollToOptions | number) {
    if (typeof opciones === "object") desplazamientos.push(opciones);
  } as typeof HTMLElement.prototype.scrollTo;
  medio(false);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("panel de texto", () => {
  it("resalta el versículo actual con aria-current", () => {
    const { container, rerender, onSaltar } = vista();
    const actuales = container.querySelectorAll('[aria-current="true"]');
    expect(actuales).toHaveLength(1);
    expect(actuales[0]?.textContent).toContain("Segunda frase inventada.");
    rerender(<PanelTextoVista carga={{ tipo: "listo", texto: sincronizado }} uiLocale="es" tiempo={45} onSaltar={onSaltar} reducirMovimiento={false} />);
    expect(container.querySelector('[aria-current="true"]')?.textContent).toContain("Quinta frase inventada.");
  });

  it("pinta la región accesible, el aviso de muestra y el crédito", () => {
    vista();
    expect(screen.getByRole("region", { name: "Texto del episodio" })).toBeTruthy();
    expect(screen.getByRole("note").textContent).toBe("Texto de ejemplo, no es una edición bíblica");
    expect(screen.getByText(/Crédito inventado para la prueba/)).toBeTruthy();
    expect(screen.getByTestId("texto-desplazable").getAttribute("aria-live")).toBe("off");
  });

  it("con Torres Amat muestra el aviso literal fijo, sin «Texto de ejemplo» ni crédito duplicado", () => {
    const real: TextoEpisodio = { ...sincronizado, muestra: false, fuente: "torres-amat" };
    vista({ carga: { tipo: "listo", texto: real } });
    const aviso = screen.getByTestId("aviso-fuente");
    expect(aviso.textContent).toBe("Texto: Torres Amat (dominio público). Puede no coincidir palabra por palabra con el audio");
    expect(aviso.getAttribute("role")).toBe("note");
    expect(screen.queryByText(/Texto de ejemplo/)).toBeNull();
    expect(screen.queryByText(/Crédito inventado/)).toBeNull();
  });

  it("abre cada capítulo con su título", () => {
    const dosCapitulos: TextoEpisodio = {
      ...sincronizado,
      episodio: "sal-003",
      versiculos: sincronizado.versiculos.map((v, i) => ({ ...v, cap: i < 2 ? 22 : 23 })),
    };
    const { container } = vista({ carga: { tipo: "listo", texto: dosCapitulos } });
    const marcas = [...container.querySelectorAll("[data-capitulo]")].map((e) => e.textContent);
    expect(marcas).toEqual(["Salmo 22", "Salmo 23"]);
  });

  it("al tocar un versículo salta a su tiempo", () => {
    const { onSaltar } = vista();
    fireEvent.click(screen.getByRole("button", { name: /versículo 4/ }));
    expect(onSaltar).toHaveBeenCalledWith(30);
  });

  it("sin tiempos muestra el texto entero, sin botones ni resaltado", () => {
    const { container, onSaltar } = vista({ carga: { tipo: "listo", texto: sinTiempos } });
    expect(screen.getByText("Este texto va sin sincronizar con el audio.")).toBeTruthy();
    expect(screen.getByTestId("texto-desplazable").querySelectorAll("button")).toHaveLength(0);
    expect(container.querySelector("[aria-current]")).toBeNull();
    fireEvent.click(screen.getByText("Tercera frase inventada."));
    expect(onSaltar).not.toHaveBeenCalled();
    expect(desplazamientos).toHaveLength(0);
  });

  it("cambia el tamaño de letra en cinco pasos y lo guarda", () => {
    vista();
    const lista = () => screen.getByTestId("texto-desplazable").querySelector("ol") as HTMLOListElement;
    const menos = screen.getByRole("button", { name: "Letra más pequeña" }) as HTMLButtonElement;
    const mas = screen.getByRole("button", { name: "Letra más grande" }) as HTMLButtonElement;
    expect(lista().style.fontSize).toBe(`${TAMANOS_TEXTO[1]}px`);
    fireEvent.click(menos);
    expect(menos.disabled).toBe(true);
    for (let i = 0; i < 6; i += 1) fireEvent.click(mas);
    expect(lista().style.fontSize).toBe(`${TAMANOS_TEXTO[4]}px`);
    expect(mas.disabled).toBe(true);
    expect(localStorage.getItem(CLAVE_TEXTO_TAMANO)).toBe("4");
  });

  it("recuerda el tamaño y el modo guardados", () => {
    localStorage.setItem(CLAVE_TEXTO_TAMANO, "3");
    localStorage.setItem(CLAVE_TEXTO_MODO, "dia");
    const { container } = vista();
    expect((screen.getByTestId("texto-desplazable").querySelector("ol") as HTMLOListElement).style.fontSize).toBe(`${TAMANOS_TEXTO[3]}px`);
    expect(container.querySelector("section")?.dataset.modo).toBe("dia");
  });

  it("alterna el modo noche y día y lo guarda", () => {
    const { container } = vista();
    const boton = screen.getByRole("button", { name: "Modo día" });
    expect(boton.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(boton);
    expect(container.querySelector("section")?.dataset.modo).toBe("dia");
    expect(localStorage.getItem(CLAVE_TEXTO_MODO)).toBe("dia");
    expect(screen.getByRole("button", { name: "Modo noche" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("se desplaza suave al versículo actual", () => {
    vista();
    expect(desplazamientos.at(-1)?.behavior).toBe("smooth");
  });

  it("sin animación si la biblioteca pide reducir movimiento", () => {
    vista({ reducirMovimiento: true });
    expect(desplazamientos.at(-1)?.behavior).toBe("auto");
  });

  it("sin animación si el sistema pide reducir movimiento", () => {
    medio(true);
    vista();
    expect(desplazamientos.at(-1)?.behavior).toBe("auto");
  });

  it("pausa el auto-desplazamiento tras un scroll a mano y ofrece volver", () => {
    vi.useFakeTimers();
    const { rerender, onSaltar } = vista();
    const antes = desplazamientos.length;
    fireEvent.wheel(screen.getByTestId("texto-desplazable"));
    const volver = screen.getByRole("button", { name: "Volver al versículo actual" });
    rerender(<PanelTextoVista carga={{ tipo: "listo", texto: sincronizado }} uiLocale="es" tiempo={25} onSaltar={onSaltar} reducirMovimiento={false} />);
    expect(desplazamientos.length).toBe(antes);
    fireEvent.click(volver);
    expect(desplazamientos.length).toBe(antes + 1);
    expect(screen.queryByRole("button", { name: "Volver al versículo actual" })).toBeNull();
    fireEvent.wheel(screen.getByTestId("texto-desplazable"));
    act(() => { vi.advanceTimersByTime(6000); });
    expect(screen.queryByRole("button", { name: "Volver al versículo actual" })).toBeNull();
  });

  it("ofrece entrar sin sesión y la prueba gratis sin permiso", () => {
    const { rerender } = render(<PanelTextoVista carga={{ tipo: "sin-sesion" }} uiLocale="es" tiempo={0} onSaltar={() => undefined} reducirMovimiento={false} />);
    expect(screen.getByRole("link", { name: "Entrar" }).getAttribute("href")).toBe("/es/entrar");
    rerender(<PanelTextoVista carga={{ tipo: "sin-permiso" }} uiLocale="es" tiempo={0} onSaltar={() => undefined} reducirMovimiento={false} />);
    expect(screen.getByRole("link", { name: "Prueba 7 días gratis" }).getAttribute("href")).toBe("/es/membresia");
    rerender(<PanelTextoVista carga={{ tipo: "sin-texto" }} uiLocale="en" tiempo={0} onSaltar={() => undefined} reducirMovimiento={false} />);
    expect(screen.getByText("This episode has no text yet.")).toBeTruthy();
    rerender(<PanelTextoVista carga={{ tipo: "cargando" }} uiLocale="es" tiempo={0} onSaltar={() => undefined} reducirMovimiento={false} />);
    expect(screen.getByRole("status").textContent).toBe("Cargando el texto");
  });

  it("cumple contraste AA en noche y día", () => {
    for (const paleta of Object.values(PALETA_TEXTO)) {
      for (const fondo of [paleta.fondo, paleta.actual]) {
        for (const tinta of [paleta.tinta, paleta.suave, paleta.numero]) expect(ratioContraste(tinta, fondo)).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it("no marca violaciones de axe", async () => {
    const { container } = vista();
    const resultados = await axe.run(container, { rules: { region: { enabled: false }, "color-contrast": { enabled: false } } });
    expect(resultados.violations).toEqual([]);
  });
});

describe("carga del panel", () => {
  function respuesta(estado: number, cuerpo: unknown) {
    return vi.fn(async () => new Response(JSON.stringify(cuerpo), { status: estado }));
  }

  it("no pinta nada si la función está apagada", async () => {
    const pedir = respuesta(404, { error: "no-encontrado" });
    vi.stubGlobal("fetch", pedir);
    const { container } = render(<PanelTexto episodioId="gn-01" idioma="es" uiLocale="es" tiempo={0} onSaltar={() => undefined} reducirMovimiento={false} />);
    await waitFor(() => expect(container.innerHTML).toBe(""));
    expect(pedir).toHaveBeenCalledWith("/api/texto/gn-01?lang=es", expect.objectContaining({ cache: "no-store" }));
  });

  it("pinta el texto que llega de la API", async () => {
    vi.stubGlobal("fetch", respuesta(200, { ...sincronizado, sincronizado: true }));
    render(<PanelTexto episodioId="gn-01" idioma="es" uiLocale="es" tiempo={0} onSaltar={() => undefined} reducirMovimiento={false} />);
    expect(await screen.findByText("Primera frase inventada.")).toBeTruthy();
  });

  it("muestra el error y deja reintentar", async () => {
    vi.stubGlobal("fetch", respuesta(503, { error: "no-disponible" }));
    render(<PanelTexto episodioId="gn-01" idioma="es" uiLocale="es" tiempo={0} onSaltar={() => undefined} reducirMovimiento={false} />);
    expect(await screen.findByRole("button", { name: "Reintentar" })).toBeTruthy();
  });
});
