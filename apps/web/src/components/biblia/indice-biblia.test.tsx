/** @vitest-environment jsdom */
import { readFileSync } from "node:fs";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import axe from "axe-core";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { UNIONES_DE_EDICION } from "@audite/domain";

vi.mock("next/navigation", () => ({ usePathname: () => "/es/biblia", useRouter: () => ({ push: vi.fn() }) }));

import Page, { generateMetadata } from "@/app/[lang]/biblia/page";
import { SitioBiblia } from "./indice-biblia";
import { SitioHeader } from "@/components/sitio";
import { copiaSitio } from "@/sitio/i18n";
import { redireccionesBiblia } from "../../../next.config";

afterEach(() => cleanup());

const es = JSON.parse(readFileSync("content/sitio/es.json", "utf8")) as Record<string, string>;
const en = JSON.parse(readFileSync("content/sitio/en.json", "utf8")) as Record<string, string>;
const CLAVES = Object.keys(es).filter((clave) => clave === "navBible" || clave.startsWith("bible"));

describe("índice canónico en /biblia", () => {
  it("el HTML del servidor trae el índice entero, sin sesión", async () => {
    const html = renderToStaticMarkup(await Page({ params: Promise.resolve({ lang: "es" }) }));
    expect(html).toContain("La Biblia en orden");
    expect(html.match(/data-libro=""/g)).toHaveLength(73);
    expect(html.match(/href="\/es\/oir\/[^"]+"/g)!.length).toBeGreaterThanOrEqual(1328);
    expect(html).toContain('href="/es/oir/gn-01"');
    expect(html).not.toContain("?t=");
    expect(html).toContain('href="/es/membresia"');
    expect(html).toContain("Empieza 7 días gratis");
    expect(html).toContain('href="/es/entrar"');
    expect(html).toContain('aria-expanded="false"');
    expect(html.indexOf(">Pentateuco<")).toBeLessThan(html.indexOf(">Históricos<"));
    expect(html.indexOf(">Cartas católicas<")).toBeLessThan(html.indexOf(">Apocalipsis<"));
    expect(html).not.toMatch(/CEE|Conferencia Episcopal/);
    expect(html).not.toMatch(/[–—]/);
  });

  it("el salmo 10 aparece, enlaza a sal-001 y explica la unión con el 9", () => {
    const html = renderToStaticMarkup(<SitioBiblia lang="es" />);
    const inicio = html.indexOf('data-capitulos="sal"');
    const salmos = html.slice(inicio, html.indexOf("</li>", html.indexOf("data-nota-union", inicio)));
    expect(salmos.match(/<li>/g)!.length).toBe(150);
    const diez = salmos.match(/<a [^>]*aria-label="Salmo 10\.[^>]*>10<\/a>/)?.[0] ?? "";
    expect(diez).toContain('href="/es/oir/sal-001"');
    expect(diez).toContain("Esta edición une el salmo 9 y el 10");
    expect(salmos).toContain('data-unido="9"');
    expect(salmos).toContain('data-nota-union="10"');
    expect(salmos.match(/<a [^>]*aria-label="Salmo 119"[^>]*>119<\/a>/)?.[0]).toContain('href="/es/oir/sal-021"');
  });

  it("un visitante busca Génesis, abre el libro y el capítulo 1 lleva a /es/oir/gn-01", () => {
    render(<SitioBiblia lang="es" />);
    fireEvent.change(screen.getByLabelText("Buscar un libro"), { target: { value: "Génesis" } });
    const visibles = [...document.querySelectorAll<HTMLElement>("[data-libro]")].filter((libro) => !libro.hidden);
    expect(visibles.map((libro) => libro.querySelector("button")?.textContent)).toEqual(["Génesis50 capítulos"]);
    const boton = screen.getByRole("button", { name: /Génesis/ });
    expect(boton.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(boton);
    expect(boton.getAttribute("aria-expanded")).toBe("true");
    const panel = document.getElementById(boton.getAttribute("aria-controls")!)!;
    expect(panel.hidden).toBe(false);
    const capitulos = within(panel).getByRole("list", { name: "Capítulos de Génesis" });
    expect(within(capitulos).getByRole("link", { name: "Génesis 1" }).getAttribute("href")).toBe("/es/oir/gn-01");
    expect(within(capitulos).getByRole("link", { name: "Génesis 24" }).getAttribute("href")).toBe("/es/oir/gn-09");
    fireEvent.click(boton);
    expect(panel.hidden).toBe(true);
  });

  it("axe no marca violaciones con Salmos abierto", async () => {
    const { container } = render(<SitioBiblia lang="es" />);
    fireEvent.click(screen.getByRole("button", { name: /Salmos/ }));
    const resultados = await axe.run(container, { rules: { region: { enabled: false }, "color-contrast": { enabled: false } } });
    expect(resultados.violations.map((violacion) => `${violacion.id}: ${violacion.nodes.length}`)).toEqual([]);
  }, 30000);

  it("el filtro de testamento deja solo el Nuevo", () => {
    render(<SitioBiblia lang="es" />);
    fireEvent.click(screen.getByRole("tab", { name: "Nuevo Testamento" }));
    const visibles = [...document.querySelectorAll<HTMLElement>("[data-libro]")].filter((libro) => !libro.hidden);
    expect(visibles).toHaveLength(27);
  });

  it("en inglés usa la misma ruta, los nombres ingleses y el arranque de siete días", async () => {
    const html = renderToStaticMarkup(<SitioBiblia lang="en" />);
    expect(html).toContain("The Bible in order");
    expect(html).toContain("Start 7 days free");
    expect(html).toContain('href="/en/oir/gn-01"');
    expect(html).toContain('aria-label="Psalm 10. This edition joins Psalm 9 and Psalm 10');
    expect(await generateMetadata({ params: Promise.resolve({ lang: "en" }) })).toMatchObject({ title: { absolute: "The Bible in order · Audite" } });
    expect(await generateMetadata({ params: Promise.resolve({ lang: "es" }) })).toMatchObject({ description: es.bibleMetaDescription });
  });

  it("los textos nuevos no traen punto y coma ni rayas ni nombran la edición", () => {
    expect(CLAVES.length).toBeGreaterThan(10);
    const textos = [...CLAVES.flatMap((clave) => [es[clave], en[clave]]), ...UNIONES_DE_EDICION.flatMap((union) => [union.nota.es, union.nota.en])];
    for (const texto of textos) {
      expect(texto, texto).toBeTruthy();
      expect(texto, texto).not.toMatch(/[;—–]/);
      expect(texto, texto).not.toMatch(/\bCEE\b|\bno\b[^.]*\bsino\b|\bnot\b[^.]*\bbut\b/i);
    }
    expect(es.navBible).toBe("Biblia");
    expect(en.navBible).toBe("Bible");
  });

  it("/en/bible lleva a /en/biblia y la cabecera marca la sección", () => {
    expect(redireccionesBiblia).toContainEqual({ source: "/en/bible", destination: "/en/biblia", permanent: true });
    const html = renderToStaticMarkup(<SitioHeader lang="es" copy={copiaSitio("es")!} />);
    const enlaces = (html.match(/<a [^>]*>/g) ?? []).filter((a) => a.includes('href="/es/biblia"'));
    expect(enlaces.length).toBeGreaterThan(0);
    expect(enlaces.at(-1)).toContain('aria-current="page"');
    expect((html.match(/<a [^>]*>/g) ?? []).filter((a) => a.includes('href="/es/catalogo"')).at(-1)).not.toContain("aria-current");
  });
});
