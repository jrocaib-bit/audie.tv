/** @vitest-environment jsdom */
import { describe, expect, it, afterEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { HuecoAdvientoO1 } from "./hueco-adviento-o1";
import { VistaRetoAnio } from "./reto-anio";
import { RETOS_ANIO } from "@/lib/retos-anio-datos";

const json = JSON.stringify({
  "reto:adviento-isaias": {
    mp4: "https://signed.example/cleve.mp4",
    poster: "https://signed.example/cleve.webp",
    aspect: "16/9",
    alt: "La Anunciación",
  },
  "reto:adviento-isaias:o1": {
    mp4: "https://signed.example/hicks.mp4",
    poster: "https://signed.example/hicks.webp",
    aspect: "4/3",
    alt: "El reino pacífico",
  },
});

const adviento = RETOS_ANIO.find((reto) => reto.id === "adviento-isaias");
const otro = RETOS_ANIO.find((reto) => reto.id === "cuaresma-40");

afterEach(() => {
  delete process.env.NEXT_PUBLIC_BUCLES_JSON;
});

describe("hueco de Hicks en Adviento", () => {
  it("no pinta hueco si o1 no está, aunque Cleve sí", () => {
    expect(renderToStaticMarkup(<HuecoAdvientoO1 json="" />)).toBe("");
    const soloCleve = JSON.stringify({
      "reto:adviento-isaias": { mp4: "https://signed.example/cleve.mp4", poster: "https://signed.example/cleve.webp", aspect: "16/9" },
    });
    expect(renderToStaticMarkup(<HuecoAdvientoO1 json={soloCleve} />)).toBe("");
    const sinPoster = JSON.stringify({ "reto:adviento-isaias:o1": { mp4: "https://signed.example/hicks.mp4", aspect: "4/3" } });
    expect(renderToStaticMarkup(<HuecoAdvientoO1 json={sinPoster} />)).toBe("");
  });

  it("reserva el cuadro completo de Hicks con el crédito del museo", () => {
    const html = renderToStaticMarkup(<HuecoAdvientoO1 lang="es" json={json} />);
    expect(html).toContain("bucle-cuadro");
    expect(html).toContain("bucle-fondo");
    expect(html).toContain("object-contain");
    expect(html).toContain("https://signed.example/hicks.webp");
    expect(html).not.toContain("cleve.webp");
    expect(html).toContain("aspect-ratio:4/3");
    expect(html).toContain("max-height:70svh");
    expect(html).toContain("El reino pacífico · Edward Hicks");
    expect(html).not.toContain("<video");
    const en = renderToStaticMarkup(<HuecoAdvientoO1 lang="en" json={json} />);
    expect(en).toContain("Peaceable Kingdom · Edward Hicks");
  });

  it("lo coloca entre la descripción y los días, y en ningún otro reto", () => {
    if (!adviento || !otro) throw new Error("faltan los retos de prueba");
    process.env.NEXT_PUBLIC_BUCLES_JSON = json;
    const html = renderToStaticMarkup(<VistaRetoAnio lang="es" reto={adviento} rangos={[]} />);
    const explica = html.indexOf(adviento.explica.es);
    const cuadro = html.indexOf('src="https://signed.example/hicks.webp"');
    const dia = html.indexOf("1. La montaña");
    const cabecera = html.slice(0, explica);
    expect(explica).toBeGreaterThan(-1);
    expect(cabecera).toContain("https://signed.example/cleve.webp");
    expect(cabecera).not.toContain('src="https://signed.example/hicks.webp"');
    expect(cuadro).toBeGreaterThan(explica);
    expect(dia).toBeGreaterThan(cuadro);
    expect(html).toContain("El reino pacífico · Edward Hicks");
    const cuaresma = renderToStaticMarkup(<VistaRetoAnio lang="es" reto={otro} rangos={[]} />);
    expect(cuaresma).not.toContain("hicks.webp");
    expect(cuaresma).not.toContain("bucle-cuadro");
    delete process.env.NEXT_PUBLIC_BUCLES_JSON;
    const vacio = renderToStaticMarkup(<VistaRetoAnio lang="es" reto={adviento} rangos={[]} />);
    expect(vacio).toContain(adviento.explica.es);
    expect(vacio).toContain("1. La montaña");
    expect(vacio).not.toContain("bucle-cuadro");
    expect(vacio).not.toContain("El reino pacífico");
  });
});
