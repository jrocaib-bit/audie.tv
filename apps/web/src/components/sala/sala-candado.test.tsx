import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { recorridoSala } from "@/lib/sala-recorridos";
import { SalaPagina } from "@/app/[lang]/sala/sala-pagina";
import { CorteSala, RelatoScroll, SalaCuenta } from "./sala-cuenta";

vi.mock("next/image", () => ({ default: () => null }));

const r = recorridoSala("gn-01")!;
const paso2 = r.pasos[1]!;
// Todo lo posterior a la apertura (ES y EN) no puede salir en HTML de no premium.
const posteriores = [
  ...r.pasos.flatMap((p) => [p.texto.es.slice(0, 40), p.titulo.es, p.texto.en.slice(0, 40), p.titulo.en]),
  r.cierre.texto.es.slice(0, 40),
  r.cierre.titulo.es,
  r.cierre.texto.en.slice(0, 40),
];

describe("La sala sin premium: la apertura sí, nada posterior", () => {
  it("el paso 2 de gn-01 es el esperado (el test no es vacío)", () => {
    expect(paso2.titulo.es).toBe("La fuente de los cuatro caños");
  });

  it("SalaPagina en servidor (sin mock, sin sesión y gratuita) incluye la apertura y ni un paso ni el cierre", () => {
    for (const lang of ["es", "en"] as const) {
      for (const mock of [undefined, "sin", "gratis"]) {
        const html = renderToStaticMarkup(SalaPagina({ lang, id: "gn-01", mock }));
        expect(html).toContain(r.apertura.titulo[lang]);
        expect(html).toContain("data-apertura");
        for (const t of posteriores) expect(html, `${lang}/${mock}: ${t}`).not.toContain(t);
        expect(html).not.toContain("La fuente de los cuatro caños");
      }
    }
  });

  it("las props del servidor solo llevan la apertura como adelanto", () => {
    const el = SalaPagina({ lang: "es", id: "gn-01" });
    expect(Object.keys(el.props)).not.toContain("recorrido");
    expect(el.props.adelanto).toEqual({ titulo: r.apertura.titulo.es, texto: r.apertura.texto.es });
    const json = JSON.stringify({ ...el.props, placa: undefined });
    for (const t of posteriores) expect(json).not.toContain(t);
  });

  it("los módulos cliente no importan el JSON ni el módulo servidor", () => {
    for (const f of ["src/components/sala/sala-cuenta.tsx", "src/lib/sala-cuenta.ts", "src/lib/sala-scroll.ts"]) {
      const src = readFileSync(`apps/web/${f}`, "utf8");
      expect(src, f).not.toMatch(/recorridos-sala/);
      expect(src, f).not.toMatch(/sala-recorridos/);
      expect(src, f).not.toMatch(/es-premium/);
    }
    expect(readFileSync("apps/web/src/lib/sala-recorridos.ts", "utf8")).toContain('import "server-only"');
    expect(readFileSync("apps/web/src/lib/es-premium.ts", "utf8")).toContain('import "server-only"');
  });
});

describe("corte de La sala", () => {
  const sin = renderToStaticMarkup(<SalaCuenta lang="es" id="gn-01" src="/x.webp" alt="Obra" titulo="La creación" adelanto={{ titulo: "Apertura", texto: "Texto de apertura." }} sesionMock="sin" />);
  const gratis = renderToStaticMarkup(<CorteSala lang="es" vista="gratuito" hrefEntrar="/es/entrar?next=%2Fes%2Fsala" />);

  it("sin sesión: vista, apertura, data-corte, prueba/premium hacia membresía y Entrar con next seguro", () => {
    expect(sin).toContain('data-vista="sin-sesion"');
    expect(sin).toContain("data-apertura");
    expect(sin).toContain("Texto de apertura.");
    expect(sin).toContain("data-corte");
    expect(sin).toContain("Prueba 7 días gratis");
    expect(sin).toContain('href="/es/membresia"');
    expect(sin).toContain(">Entrar<");
    expect(sin).toContain("/es/entrar?next=%2Fes%2Fsala");
    expect(sin.indexOf("<h1")).toBeLessThan(sin.indexOf("data-apertura"));
    expect(sin.indexOf("data-apertura")).toBeLessThan(sin.indexOf("data-corte"));
  });
  it("gratuito: botón premium y sin «Entrar»", () => {
    expect(gratis).toContain("data-corte");
    expect(gratis).toContain('href="/es/membresia"');
    expect(gratis).not.toContain("Entrar");
    expect(gratis).not.toContain("/entrar");
  });
  it("en inglés lleva /en/membresia", () => {
    const en = renderToStaticMarkup(<CorteSala lang="en" vista="sin-sesion" hrefEntrar="/en/entrar?next=%2Fen%2Fsala" />);
    expect(en).toContain('href="/en/membresia"');
    expect(en).toContain("Try 7 days free");
    expect(en).toContain("Sign in");
  });
  it("con sesión sin confirmar acceso no se muestran botones (mock gratis, aún sin respuesta)", () => {
    const html = renderToStaticMarkup(<SalaCuenta lang="es" id="gn-01" src="/x.webp" alt="Obra" titulo="La creación" sesionMock="gratis" />);
    expect(html).toContain('data-vista="gratuito"');
    expect(html).not.toContain("/membresia");
    expect(html).not.toContain("Entrar");
  });
});

describe("relato con scroll (premium)", () => {
  const datos = { acceso: "premium" as const, ...{ apertura: { titulo: r.apertura.titulo.es, texto: r.apertura.texto.es }, pasos: r.pasos.map((p) => ({ x: p.x, y: p.y, zoom: p.zoom, titulo: p.titulo.es, texto: p.texto.es })), cierre: { titulo: r.cierre.titulo.es, texto: r.cierre.texto.es } } };
  const html = renderToStaticMarkup(<RelatoScroll lang="es" id="gn-01" src="/x.webp" alt="Obra" titulo="La creación" datos={datos} />);
  const reducido = renderToStaticMarkup(<RelatoScroll lang="es" id="gn-01" src="/x.webp" alt="Obra" titulo="La creación" datos={datos} reducido />);

  it("estructura: apertura, N pasos, cierre, cámara entera y atributos", () => {
    expect(html).toContain('data-vista="premium"');
    expect(html).toContain("data-apertura");
    for (let i = 1; i <= r.pasos.length; i++) expect(html).toContain(`data-paso="${i}"`);
    expect(html).toContain("data-cierre");
    expect(html).toContain('data-camara="entera"');
    expect(html).toContain('data-paso-activo="apertura"');
    expect(html).toContain("Escuchar el episodio");
    expect(html).not.toContain("Ver en la obra");
    expect(html).not.toContain("Ver la obra entera");
    expect(html).not.toContain("data-corte");
  });
  it("con movimiento: los bloques aún no revelados parten con opacity 0", () => {
    expect(html).toContain("opacity:0");
  });
  it("movimiento reducido: todos los textos visibles, sin fundidos ni zoom", () => {
    expect(reducido).toContain("data-reducido");
    expect(reducido).not.toContain("opacity:0");
    expect(reducido).toContain('data-camara="entera"');
    expect(reducido).toContain("data-zoom=\"1\"");
    expect(reducido).toContain(paso2.texto.es.slice(0, 40));
    expect(reducido).toContain(r.cierre.texto.es.slice(0, 40));
    expect(reducido).toContain("transform:none");
  });
});
