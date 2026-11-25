import { beforeEach, describe, expect, it, vi } from "vitest";

const insert = vi.fn(async () => ({ error: null }));
const upsert = vi.fn(async () => ({ error: null }));
const from = vi.fn((tabla: string) => (tabla === "analytics_events" ? { insert } : { upsert }));
let usuario: { id: string; email?: string } | null = null;

vi.mock("react-native", () => ({ Platform: { OS: "ios" } }));
vi.mock("./auth", () => ({
  supabaseApp: () => ({ from, auth: { getSession: async () => ({ data: { session: usuario ? { user: usuario } : null } }) } }),
}));

import { medir } from "./medicion";

const espera = () => new Promise((r) => setTimeout(r, 20));

beforeEach(() => {
  insert.mockClear();
  upsert.mockClear();
  from.mockClear();
  usuario = null;
});

describe("medir", () => {
  it("envía el evento con session_id UUID v4, versión 1.0.0 y plataforma", async () => {
    await medir("challenge_started", { reto_id: "adviento-isaias" });
    await espera();
    expect(insert).toHaveBeenCalledTimes(1);
    const fila = (insert.mock.calls[0] as unknown as [Record<string, unknown>])[0];
    expect(String(fila.session_id)).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-8[0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(fila.app_version).toBe("1.0.0");
    expect(fila.platform).toBe("ios");
    expect(JSON.stringify(fila)).not.toContain("@");
  });
  it("el correo solo sirve para clasificar y no viaja en la fila", async () => {
    usuario = { id: "u1", email: "alguien@example.com" };
    medir("challenge_started", { reto_id: "adviento-isaias" });
    await espera();
    expect(JSON.stringify(insert.mock.calls)).not.toContain("alguien@example.com");
  });
});
