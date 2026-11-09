import { describe, expect, it } from "vitest";
import { createMemoryPorts } from "./local";
import { createSupabasePorts, createSupabasePortsFromClient, type SupabaseQuery } from "./supabase";

describe("puertos de datos", () => {
  it("guarda el avance y los días en memoria, sin red", async () => {
    const ports = createMemoryPorts({ userId: "persona" });
    ports.seedProfile({ id: "persona", displayName: null });
    await ports.library.saveProgress({
      userId: "persona",
      episodeId: "gn-01",
      positionSeconds: 12,
      completed: false,
      updatedAt: "2026-11-09T10:00:00Z",
    });
    await ports.library.recordListeningDay("persona", "2026-11-09");
    expect(await ports.auth.getSession()).toEqual({ userId: "persona" });
    expect(await ports.library.getProgress("persona")).toHaveLength(1);
    expect(await ports.library.getListeningDays("persona")).toEqual(["2026-11-09"]);
    expect(await ports.library.getSubscription("persona")).toBeNull();
  });

  it("no abre Supabase si faltan las variables", () => {
    expect(() => createSupabasePorts({ url: "", anonKey: "" })).toThrow(/no está configurado/i);
    expect(() => createSupabasePorts({ url: "https://example.supabase.co", anonKey: "  " })).toThrow(/no está configurado/i);
  });

  it("lee el estado de suscripción como dato, sin proveedor de pago", async () => {
    const calls: string[] = [];
    const client: SupabaseQuery = {
      auth: { async getSession() { return { data: { session: null } }; } },
      from(table) {
        calls.push(table);
        return {
          select() {
            return {
              eq() {
                return {
                  async maybeSingle() {
                    return { data: { user_id: "persona", status: "none", updated_at: "2026-11-09T10:00:00Z" }, error: null };
                  },
                  then(onfulfilled) {
                    return Promise.resolve(onfulfilled({ data: [], error: null }));
                  },
                };
              },
            };
          },
          async upsert() {
            return { data: null, error: null };
          },
        };
      },
    };
    const ports = createSupabasePortsFromClient(client);
    const status = await ports.library.getSubscription("persona");
    expect(status).toEqual({ userId: "persona", status: "none", updatedAt: "2026-11-09T10:00:00Z" });
    expect(calls).toEqual(["subscription_status"]);
    expect(JSON.stringify(status)).not.toMatch(/stripe|price|checkout/i);
  });
});
