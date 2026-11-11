import { beforeEach, describe, expect, it, vi } from "vitest";

const doble = vi.hoisted(() => ({
  email: "ana@audite.tv",
  status: "none",
  signedUrl: "https://cdn.example/audio.mp3",
  firmaError: null as { message: string } | null,
  userError: null as { message: string } | null,
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    auth: {
      getUser: async () => ({
        data: { user: doble.userError ? null : { id: "usuario-1", email: doble.email } },
        error: doble.userError,
      }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: { status: doble.status }, error: null }),
        }),
      }),
    }),
    storage: {
      from: () => ({
        createSignedUrl: async () => ({ data: doble.firmaError ? null : { signedUrl: doble.signedUrl }, error: doble.firmaError }),
      }),
    },
    rpc: async () => ({ data: true, error: null }),
  }),
}));

import { GET } from "./route";

function pedir(id: string, token?: string) {
  const headers = new Headers();
  if (token) headers.set("authorization", `Bearer ${token}`);
  return GET(new Request(`http://audite.test/api/audio/${id}`, { headers }), { params: Promise.resolve({ id }) });
}

describe("ruta de audio", () => {
  beforeEach(() => {
    doble.email = "ana@audite.tv";
    doble.status = "none";
    doble.firmaError = null;
    doble.userError = null;
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://qdjowihivtqoelurvyke.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "super-secret-key";
    process.env.AUDIO_ACCESO = "internos";
    process.env.AUDIO_EMAILS_PERMITIDOS = "ana@audite.tv";
    process.env.AUDIO_GRATIS = "gn-01";
  });

  it("responde 404 si el episodio no está listo", async () => {
    const respuesta = await pedir("nm-01", "token");
    expect(respuesta.status).toBe(404);
  });

  it("responde 401 sin sesión cuando el episodio no es gratis", async () => {
    const respuesta = await pedir("gn-02");
    expect(respuesta.status).toBe(401);
  });

  it("deja oír Adviento entero sin suscripción", async () => {
    process.env.AUDIO_GRATIS = "";
    process.env.AUDIO_ACCESO = "suscripcion";
    const respuesta = await pedir("is-02");
    expect(respuesta.status).toBe(200);
  });

  it("deja oír un episodio gratis sin sesión", async () => {
    const respuesta = await pedir("gn-01");
    expect(respuesta.status).toBe(200);
    const cuerpo = await respuesta.json() as { url: string; expira: number };
    expect(cuerpo.url).toBe("https://cdn.example/audio.mp3");
    expect(cuerpo.expira).toBeGreaterThan(Date.now());
    expect(respuesta.headers.get("cache-control")).toBe("no-store");
    expect(JSON.stringify(cuerpo)).not.toContain("super-secret-key");
  });

  it("responde 403 si el correo no está en la lista de internos", async () => {
    doble.email = "otra@audite.tv";
    const respuesta = await pedir("gn-02", "token");
    expect(respuesta.status).toBe(403);
  });

  it("firma una hora cuando el correo está permitido", async () => {
    const respuesta = await pedir("gn-02", "token");
    expect(respuesta.status).toBe(200);
    const cuerpo = await respuesta.json() as { url: string };
    expect(cuerpo.url).toBe("https://cdn.example/audio.mp3");
    expect(JSON.stringify(cuerpo)).not.toContain("super-secret-key");
  });

  it("responde 503 sin la clave de servicio y no la escribe", async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const respuesta = await pedir("gn-02", "token");
    expect(respuesta.status).toBe(503);
    expect(await respuesta.text()).not.toContain("super-secret-key");
  });
});
