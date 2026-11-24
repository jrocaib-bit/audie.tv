import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

let mock: string | null = null;
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: () => undefined, replace: () => undefined }),
  usePathname: () => "/es/sala/gn-01",
  useSearchParams: () => new URLSearchParams(mock ? { mock } : {}),
}));
import { SitioHeader } from "@/components/sitio";
import { mockConSesion } from "@/components/enlace-cuenta";
import { copiaSitio } from "@/sitio/i18n";

afterEach(() => {
  mock = null;
  vi.unstubAllEnvs();
});
const cabecera = () => renderToStaticMarkup(<SitioHeader lang="es" copy={copiaSitio("es")!} />);

describe("cabecera con ?mock= (solo fuera de producción)", () => {
  it.each(["gratis", "premium", "con"])("mock=%s: sin enlace a /es/entrar", (m) => {
    mock = m;
    const html = cabecera();
    expect(html).not.toContain("/es/entrar");
    expect(html).toContain("Cuenta");
  });
  it("mock=sin o sin mock: enlace a /es/entrar", () => {
    mock = "sin";
    expect(cabecera()).toContain("/es/entrar");
    mock = null;
    expect(cabecera()).toContain("/es/entrar");
  });
  it("en producción el mock se ignora", () => {
    vi.stubEnv("NODE_ENV", "production");
    mock = "premium";
    expect(cabecera()).toContain("/es/entrar");
    expect(mockConSesion("premium", "production")).toBe(false);
    expect(mockConSesion("premium", "development")).toBe(true);
  });
});
