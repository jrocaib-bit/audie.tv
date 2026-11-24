// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RelatoScroll } from "./sala-cuenta";

vi.mock("next/image", () => ({ default: () => null }));
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const datos = {
  apertura: { titulo: "A", texto: "Texto apertura" },
  pasos: [
    { x: 0.31, y: 0.87, zoom: 2.6, titulo: "P1", texto: "Texto uno" },
    { x: 0.55, y: 0.42, zoom: 2.4, titulo: "P2", texto: "Texto dos" },
  ],
  cierre: { titulo: "C", texto: "Texto cierre" },
};

const raices: ReturnType<typeof createRoot>[] = [];

function montar(reduce: boolean) {
  window.matchMedia = ((q: string) => ({ matches: reduce && q.includes("reduce"), media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
  const div = document.createElement("div");
  document.body.append(div);
  const root = createRoot(div);
  raices.push(root);
  act(() => root.render(<RelatoScroll lang="es" id="gn-01" src="/x.webp" alt="Obra" titulo="T" datos={datos} />));
  return { div, root };
}

afterEach(() => {
  // Desmonta para que el planificador de React no deje trabajo pendiente tras cerrar el entorno.
  for (const root of raices.splice(0)) act(() => root.unmount());
  document.body.innerHTML = "";
});

describe("relato con prefers-reduced-motion (matchMedia)", () => {
  it("reduce: textos visibles, cuadro entero y sin zoom", () => {
    const { div } = montar(true);
    const main = div.querySelector("main")!;
    expect(main.hasAttribute("data-reducido")).toBe(true);
    expect(main.getAttribute("data-camara")).toBe("entera");
    for (const t of ["Texto apertura", "Texto uno", "Texto dos", "Texto cierre"]) expect(div.textContent).toContain(t);
    for (const el of div.querySelectorAll<HTMLElement>("[data-bloque]")) expect(el.style.opacity).not.toBe("0");
    expect(div.querySelector<HTMLElement>("[data-visor]")!.getAttribute("data-zoom")).toBe("1");
    expect(div.querySelector("[data-visor]")!.getAttribute("data-mascara")).toBe("ninguna");
    expect(div.querySelector("[data-capa-mascara]")).toBeNull();
  });
  it("sin reduce: los bloques se animan (opacity inline) y no hay data-reducido", () => {
    const { div } = montar(false);
    expect(div.querySelector("main")!.hasAttribute("data-reducido")).toBe(false);
    expect(div.querySelector<HTMLElement>("[data-paso='2']")!.style.opacity).not.toBe("");
  });
});
