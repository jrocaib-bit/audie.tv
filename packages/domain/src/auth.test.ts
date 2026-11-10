import { describe, expect, it, vi } from "vitest";
import { PROVEEDORES_ALTA, AUTH_URLS, borrarCuenta, cargaLocal, cerrarSesion, entrarConCorreo, entrarConOAuth, entrarConToken, planDeMigracion, redirectDe, type ClienteAuth } from "./auth";
import { marcadoresVacios } from "./notas";
import { emptyProgress } from "./progress";

function cliente(parcial: Partial<ClienteAuth> = {}): ClienteAuth {
  return {
    signInWithIdToken: vi.fn(async (proveedor) => ({ userId: "u1", email: null, proveedor })),
    signInWithOAuth: vi.fn(async (_proveedor, redirectTo) => ({ url: `https://qdjowihivtqoelurvyke.supabase.co/auth/v1/authorize?redirect_to=${redirectTo}` })),
    signInWithOtp: vi.fn(async () => undefined),
    getSession: vi.fn(async () => ({ userId: "u1", email: "a@audite.tv", proveedor: "correo" as const })),
    signOut: vi.fn(async () => undefined),
    deleteUser: vi.fn(async () => undefined),
    subirLocal: vi.fn(async () => undefined),
    ...parcial,
  };
}

describe("alta", () => {
  it("pone a Apple y a Google al mismo nivel y el correo debajo", () => {
    expect(PROVEEDORES_ALTA).toEqual(["apple", "google", "correo"]);
    expect(PROVEEDORES_ALTA.indexOf("apple")).toBe(PROVEEDORES_ALTA.indexOf("google") - 1);
    expect(PROVEEDORES_ALTA.at(-1)).toBe("correo");
  });

  it("entra con id_token, OAuth y enlace mágico hacia las URLs de Audite", async () => {
    const falso = cliente();
    await entrarConToken(falso, "apple", "token-apple");
    await entrarConToken(falso, "google", "token-google");
    expect(falso.signInWithIdToken).toHaveBeenCalledWith("apple", "token-apple");
    expect(falso.signInWithIdToken).toHaveBeenCalledWith("google", "token-google");
    await expect(entrarConToken(falso, "google", "  ")).rejects.toThrow("sin-token");

    const web = await entrarConOAuth(falso, "google", "web");
    const app = await entrarConOAuth(falso, "apple", "app");
    expect(web).toContain(AUTH_URLS.callbackWeb);
    expect(app).toContain(AUTH_URLS.callbackApp);
    expect(redirectDe("web")).toBe("https://audite.tv/auth/callback");
    expect(redirectDe("app")).toBe("audite://auth/callback");

    await entrarConCorreo(falso, "persona@correo.test", "web");
    expect(falso.signInWithOtp).toHaveBeenCalledWith("persona@correo.test", AUTH_URLS.callbackWeb);
    await expect(entrarConCorreo(falso, "no-es-correo", "web")).rejects.toThrow("correo");
  });

  it("cierra sesión, borra la cuenta y migra lo local solo la primera vez", async () => {
    const falso = cliente();
    await cerrarSesion(falso);
    expect(falso.signOut).toHaveBeenCalledOnce();
    await borrarCuenta(falso);
    expect(falso.deleteUser).toHaveBeenCalledOnce();
    expect(falso.signOut).toHaveBeenCalledTimes(2);

    const marcadores = marcadoresVacios();
    marcadores.favoritos.push({ episodeId: "gn-01", creadoEn: "2026-11-10" });
    const progreso = emptyProgress();
    progreso.episodes["gn-01"] = { positionSeconds: 12, updatedAt: "2026-11-10", completed: false };
    progreso.listenedOn = ["2026-11-10"];
    const carga = cargaLocal(marcadores, progreso);
    expect(planDeMigracion(false, carga)?.favoritos).toEqual([{ episodeId: "gn-01" }]);
    expect(planDeMigracion(true, carga)).toBeNull();
    expect(planDeMigracion(false, cargaLocal(marcadoresVacios(), emptyProgress()))).toBeNull();
  });
});
