import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Lector } from "@/components/libros/lector";
import { cargarTexto } from "./carga";
import { armarPropsLector } from "./props-lector";
import PaginaLeer from "@/app/[lang]/libros/[slug]/leer/page";
import PaginaFicha from "@/app/[lang]/libros/[slug]/page";
import PaginaCatalogo from "@/app/[lang]/libros/page";
import PaginaEpisodio from "@/app/[lang]/episodio/[id]/page";

const FIXTURES = path.resolve(import.meta.dirname, "fixtures");
const SECRETOS = ["TEXTO_PREMIUM_CAPITULO_PRUEBA_XYZ", "TEXTO_PREMIUM_EPILOGO_PRUEBA_XYZ"];

beforeEach(() => {
  vi.stubEnv("AUDITE_LIBROS_RUTA", FIXTURES);
  vi.stubEnv("AUDITE_MOSTRAR_AMAZON", "");
  vi.stubEnv("NODE_ENV", "test");
});
afterEach(() => vi.unstubAllEnvs());

const ficha = { slug: "libro-prueba", volumen: 1 };

describe("candado en el servidor de páginas", () => {
  it("las props del lector no llevan texto posterior al adelanto, ni pidiéndolo por URL", async () => {
    const libro = (await cargarTexto("libro-prueba"))!;
    for (const capitulo of [null, "prologo", "capitulo-01", "epilogo"]) {
      for (const mock of [null, "premium" as const]) {
        const props = armarPropsLector(libro, ficha, { lang: "es", capitulo, mock });
        const crudo = JSON.stringify(props);
        for (const secreto of SECRETOS) expect(crudo).not.toContain(secreto);
        expect(props.capitulos.map((c) => c.id)).toEqual(["prologo"]);
        expect(props.indice.map((i) => i.titulo)).toContain("Capítulo de prueba");
      }
    }
    const pedido = armarPropsLector(libro, ficha, { lang: "es", capitulo: "capitulo-01", mock: null });
    expect(pedido.capituloPedido).toBe("capitulo-01");
    expect(pedido.capituloInicial).toBe("prologo");
    expect(armarPropsLector(libro, ficha, { lang: "es", capitulo: "../x", mock: null }).capituloPedido).toBeNull();
  });

  it("la página de leer serializa solo el prólogo, también con mock premium", async () => {
    for (const mock of [undefined, "premium", "gratis"]) {
      const elemento = await PaginaLeer({ params: Promise.resolve({ lang: "es", slug: "libro-prueba" }), searchParams: Promise.resolve({ c: "capitulo-01", mock }) });
      const crudo = JSON.stringify(elemento.props);
      for (const secreto of SECRETOS) expect(crudo).not.toContain(secreto);
      expect(crudo).toContain("TEXTO_ADELANTO_PRUEBA");
    }
  });

  it("en producción el mock de la página se ignora", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const elemento = await PaginaLeer({ params: Promise.resolve({ lang: "es", slug: "libro-prueba" }), searchParams: Promise.resolve({ mock: "premium" }) });
    expect(elemento.props.mock).toBeNull();
  });

  it("el HTML del lector sin sesión: prólogo, índice con títulos y tarjeta de corte con Entrar", async () => {
    const libro = (await cargarTexto("libro-prueba"))!;
    const props = armarPropsLector(libro, ficha, { lang: "es", capitulo: null, mock: null });
    const html = renderToStaticMarkup(<Lector {...props} />);
    expect(html).toContain("TEXTO_ADELANTO_PRUEBA");
    expect(html).toContain("Capítulo de prueba");
    for (const secreto of SECRETOS) expect(html).not.toContain(secreto);
    expect(html).toContain('data-vista="sin-sesion"');
    expect(html).toContain("El libro sigue aquí");
    expect(html).toContain("Prueba 7 días gratis");
    expect(html).toContain("8,00 € al año");
    expect(html).toContain("1,99 € al mes");
    expect(html).toContain("/es/membresia");
    expect(html).toContain("/es/entrar?next=%2Fes%2Flibros%2Flibro-prueba%2Fleer");
    expect(html).toContain('href="/es/episodio/gn-01?desde=%2Fes%2Flibros%2Flibro-prueba%2Fleer%3Fc%3Dprologo%26b%3Dprologo-p-001"');
    expect(html).toContain('data-tema="noche"');
    expect(html).not.toMatch(/Gazpacho|SF Pro/);
  });

  it("con cuenta gratuita no hay Entrar; con premium no hay corte", async () => {
    const libro = (await cargarTexto("libro-prueba"))!;
    const gratis = renderToStaticMarkup(<Lector {...armarPropsLector(libro, ficha, { lang: "es", capitulo: null, mock: "gratis" })} />);
    expect(gratis).toContain('data-vista="gratuito"');
    expect(gratis).toContain("Prueba 7 días gratis");
    expect(gratis).not.toContain('data-accion="entrar"');
    const premium = renderToStaticMarkup(<Lector {...armarPropsLector(libro, ficha, { lang: "es", capitulo: null, mock: "premium" })} />);
    expect(premium).not.toContain("data-corte");
    for (const secreto of SECRETOS) expect(premium).not.toContain(secreto);
  });
});

describe("catálogo y ficha", () => {
  it("catálogo: los listos primero y los borradores como En preparación, sin enlace", async () => {
    const html = renderToStaticMarkup(await PaginaCatalogo({ params: Promise.resolve({ lang: "es" }) }));
    expect(html.indexOf("Libro de prueba")).toBeLessThan(html.indexOf("En borrador"));
    expect(html).toContain("En preparación");
    expect(html).toContain('href="/es/libros/libro-prueba"');
    expect(html).not.toContain('href="/es/libros/en-borrador"');
    expect(html).not.toContain("no-debe-salir");
  });

  it("ficha: lectura, índice, audiolibro desactivado y sin Amazon con el flag apagado", async () => {
    const html = renderToStaticMarkup(await PaginaFicha({ params: Promise.resolve({ lang: "es", slug: "libro-prueba" }) }));
    expect(html).toContain("Leer el adelanto");
    expect(html).toContain("Prólogo de prueba");
    expect(html).toMatch(/<button[^>]*disabled[^>]*data-accion="audiolibro"/);
    expect(html).toContain("El audiolibro llegará a Audite.");
    expect(html).not.toContain("Comprar en");
    expect(html).not.toContain("amazon");
    for (const secreto of [...SECRETOS, "TEXTO_ADELANTO_PRUEBA"]) expect(html).not.toContain(secreto);
  });

  it("ficha con el flag: papel y Kindle en la web", async () => {
    vi.stubEnv("AUDITE_MOSTRAR_AMAZON", "1");
    const html = renderToStaticMarkup(await PaginaFicha({ params: Promise.resolve({ lang: "es", slug: "libro-prueba" }) }));
    expect(html).toContain("Comprar en papel");
    expect(html).toContain("Comprar en Kindle");
  });

  it("ficha de un completo sin texto: aviso afirmativo y sin enlace de lectura; el borrador tiene landing sin lectura", async () => {
    const html = renderToStaticMarkup(await PaginaFicha({ params: Promise.resolve({ lang: "es", slug: "completo-sin-texto" }) }));
    expect(html).toContain("La lectura de este volumen en Audite se está preparando.");
    expect(html).not.toContain("Leer el adelanto");
    expect(html).not.toContain("/leer");
    const borrador = renderToStaticMarkup(await PaginaFicha({ params: Promise.resolve({ lang: "es", slug: "en-borrador" }) }));
    expect(borrador).toContain("En preparación");
    expect(borrador).not.toContain("/leer");
    await expect(PaginaFicha({ params: Promise.resolve({ lang: "es", slug: "no-existe" }) })).rejects.toThrow();
  });

  it("episodio: redirige a la ficha del catálogo y solo conserva una vuelta segura", async () => {
    const destino = async (id: string, desde?: string) => {
      try {
        await PaginaEpisodio({ params: Promise.resolve({ lang: "es", id }), searchParams: Promise.resolve({ desde }) });
      } catch (error) {
        return (error as { digest?: string }).digest ?? String(error);
      }
      return "";
    };
    expect(await destino("gn-10")).toContain("/es/catalogo/gn-10");
    expect(await destino("gn-10", "/es/libros/x/leer?c=prologo")).toContain("desde=%2Fes%2Flibros%2Fx%2Fleer%3Fc%3Dprologo");
    expect(await destino("gn-10", "https://evil.test")).not.toContain("evil");
    expect(await destino("no-existe-99")).toContain("NEXT_HTTP_ERROR_FALLBACK;404");
  });
});


describe("portada de Libros con estantería", () => {
  const CON = path.join(FIXTURES, "con-estanteria");

  it("con estanteria.json la página monta la estantería y pasa ?libro= y el mock", async () => {
    vi.stubEnv("AUDITE_LIBROS_RUTA", CON);
    const elemento = await PaginaCatalogo({ params: Promise.resolve({ lang: "es" }), searchParams: Promise.resolve({ libro: "libro-prueba", mock: "premium" }) });
    const html = renderToStaticMarkup(elemento);
    expect(html).toContain("data-estanteria");
    expect([...html.matchAll(/data-lomo="/g)]).toHaveLength(3);
    expect(html).toContain("La Escritura, leída con los Padres");
    expect(html).not.toContain("data-libro=");
    const props = JSON.stringify(elemento);
    expect(props).toContain('"libroInicial":"libro-prueba"');
    expect(props).toContain('"mock":"premium"');
  });

  it("en producción el mock se ignora y un ?libro= inválido se descarta", async () => {
    vi.stubEnv("AUDITE_LIBROS_RUTA", CON);
    vi.stubEnv("NODE_ENV", "production");
    const elemento = await PaginaCatalogo({ params: Promise.resolve({ lang: "es" }), searchParams: Promise.resolve({ libro: "../x", mock: "premium" }) });
    const props = JSON.stringify(elemento);
    expect(props).toContain('"libroInicial":null');
    expect(props).toContain('"mock":null');
  });

  it("sin estanteria.json se mantiene la cuadrícula", async () => {
    const html = renderToStaticMarkup(await PaginaCatalogo({ params: Promise.resolve({ lang: "es" }), searchParams: Promise.resolve({}) }));
    expect(html).not.toContain("data-estanteria");
    expect(html).toContain('href="/es/libros/libro-prueba"');
  });
});
