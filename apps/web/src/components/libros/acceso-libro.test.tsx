/** @vitest-environment jsdom */
import { act, cleanup, render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { botonesFicha, type VistaLector } from "@audite/domain";
import { BotonesLibro, ProveedorAcceso } from "./acceso-libro";

const consulta = vi.hoisted(() => ({ vista: "sin-sesion" as VistaLector, progreso: false }));
vi.mock("@/lib/libros/acceso-cliente", () => ({
  consultarVista: async () => consulta.vista,
  hayProgreso: () => consulta.progreso,
}));
vi.mock("next/link", () => ({
  default: ({ href, children, ...resto }: { href: string; children: React.ReactNode } & Record<string, unknown>) => <a href={href} {...resto}>{children}</a>,
}));

afterEach(() => {
  cleanup();
  consulta.vista = "sin-sesion";
  consulta.progreso = false;
});

const botones = (ui: "es" | "en" = "es", disponibilidad: "lectura" | "borrador" = "lectura") => (
  <ProveedorAcceso id="libro-x" mock={null} activo={disponibilidad === "lectura"}>
    <BotonesLibro lang={ui} id="libro-x" disponibilidad={disponibilidad} ui={ui} mock={null} ubicacion="resumen" />
  </ProveedorAcceso>
);
const acciones = () => [...document.querySelectorAll("[data-accion]")].map((a) => `${a.getAttribute("data-accion")}:${a.textContent}`);

async function montar(ui: "es" | "en" = "es") {
  render(botones(ui));
  await act(async () => {});
}

describe("botones de acceso de la landing", () => {
  it("el HTML de servidor es el de sin sesión y coincide con botonesFicha", () => {
    const h = renderToStaticMarkup(botones());
    expect(h).toContain('data-vista="sin-sesion"');
    for (const boton of botonesFicha("sin-sesion", "lectura")) expect(h).toContain(`>${boton.etiqueta}<`);
  });

  it("sin sesión: adelanto, prueba y Entrar", async () => {
    await montar();
    expect(acciones()).toEqual(["leer:Leer el adelanto", "prueba:Prueba 7 días gratis", "entrar:Entrar"]);
  });

  it("gratuito: adelanto y Hazte premium, sin Entrar", async () => {
    consulta.vista = "gratuito";
    await montar();
    expect(acciones()).toEqual(["leer:Leer el adelanto", "premium:Hazte premium"]);
    expect(document.querySelector('[data-accion="premium"]')?.getAttribute("href")).toBe("/es/membresia");
  });

  it("premium: solo Leer, sin suscripción ni Entrar", async () => {
    consulta.vista = "premium";
    await montar();
    expect(acciones()).toEqual(["leer:Leer"]);
    expect(document.querySelector('[data-vista="premium"]')).not.toBeNull();
  });

  it("premium con progreso guardado: Seguir leyendo", async () => {
    consulta.vista = "premium";
    consulta.progreso = true;
    await montar();
    expect(acciones()).toEqual(["leer:Seguir leyendo"]);
  });

  it("en inglés las mismas reglas con etiquetas en inglés", async () => {
    consulta.vista = "gratuito";
    await montar("en");
    expect(acciones()).toEqual(["leer:Read the preview", "premium:Go premium"]);
    expect(document.querySelector('[data-accion="leer"]')?.getAttribute("href")).toBe("/en/libros/libro-x/leer");
  });

  it("un borrador no ofrece ningún botón", async () => {
    consulta.vista = "premium";
    render(botones("es", "borrador"));
    await act(async () => {});
    expect(acciones()).toEqual([]);
  });
});
