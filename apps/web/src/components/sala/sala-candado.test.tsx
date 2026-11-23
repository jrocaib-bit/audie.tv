import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { recorridoSala } from "@/lib/sala-recorridos";
import { SalaPagina } from "@/app/[lang]/sala/sala-pagina";
import { SalaCuenta } from "./sala-cuenta";

vi.mock("next/image", () => ({ default: () => null }));

const r = recorridoSala("gn-01")!;
const paso = r.pasos[0]!;
const prohibidos = [
  paso.texto.es,
  paso.texto.es.slice(0, 40),
  paso.titulo.es,
  r.apertura.texto.es.slice(0, 40),
  r.apertura.titulo.es,
  r.cierre.texto.es.slice(0, 40),
  r.cierre.titulo.es,
];

describe("La sala sin sesión: no hay fuga del recorrido", () => {
  it("el paso de gn-01 empieza como se espera (el test no es vacío)", () => {
    expect(paso.texto.es.startsWith("Empieza abajo a la izquierda")).toBe(true);
  });

  it("SalaPagina renderizada en servidor no contiene apertura, pasos ni cierre", () => {
    for (const lang of ["es", "en"]) {
      const html = renderToStaticMarkup(SalaPagina({ lang, id: "gn-01" }));
      expect(html).toContain('data-vista="adelanto"');
      for (const t of prohibidos) expect(html, t).not.toContain(t);
      for (const t of [paso.texto.en, paso.titulo.en, r.apertura.texto.en.slice(0, 40), r.cierre.texto.en.slice(0, 40)]) expect(html).not.toContain(t);
    }
  });

  it("las props que el servidor pasa a SalaCuenta no incluyen recorrido", () => {
    const el = SalaPagina({ lang: "es", id: "gn-01" });
    expect(Object.keys(el.props)).not.toContain("recorrido");
    expect(JSON.stringify({ ...el.props, placa: undefined })).not.toContain(paso.texto.es.slice(0, 30));
  });

  it("los módulos cliente no importan recorridos-sala.json ni el módulo servidor", () => {
    for (const f of ["src/components/sala/sala-cuenta.tsx", "src/lib/sala-cuenta.ts", "src/app/[lang]/sala/sala-pagina.tsx"]) {
      const src = readFileSync(`apps/web/${f}`, "utf8");
      expect(src, f).not.toMatch(/recorridos-sala/);
      expect(src, f).not.toMatch(/sala-recorridos/);
    }
    expect(readFileSync("apps/web/src/lib/sala-recorridos.ts", "utf8")).toContain('import "server-only"');
  });
});

describe("La sala: el adelanto cabe en la primera pantalla", () => {
  const html = renderToStaticMarkup(
    <SalaCuenta lang="es" id="gn-01" src="/x.webp" alt="Obra" titulo="La creación" sesionMock={null} />,
  );
  it("el visor no lleva alturas fijas de 62/70svh", () => {
    expect(html).not.toContain("62svh");
    expect(html).not.toContain("70svh");
    expect(html).toContain("flex-1");
  });
  it("título, tarjeta y botones están dentro del primer bloque", () => {
    const ini = html.indexOf("data-primera-pantalla");
    expect(ini).toBeGreaterThan(-1);
    const bloque = html.slice(ini);
    for (const marca of ["<h1", "data-candado", "Crear cuenta", "Entrar"]) expect(bloque).toContain(marca);
    expect(html.indexOf("<h1")).toBeGreaterThan(ini);
  });
});
