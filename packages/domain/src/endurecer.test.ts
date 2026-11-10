import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sql = readFileSync(new URL("../../../supabase/migrations/20261110130000_endurecer.sql", import.meta.url), "utf8");

const politicas = [
  "read own profile",
  "update own profile",
  "read own progress",
  "insert own progress",
  "update own progress",
  "read own listening days",
  "insert own listening days",
  "read own subscription",
  "read own favorites",
  "insert own favorites",
  "delete own favorites",
  "read own notes",
  "insert own notes",
  "delete own notes",
  "members read rooms",
  "members read membership",
];

describe("migración de advisors", () => {
  it("deja el trigger sin ejecución pública y el borrado solo a authenticated", () => {
    expect(sql).toContain("set search_path = ''");
    expect(sql.match(/set search_path = ''/g)).toHaveLength(2);
    expect(sql).toContain("revoke all on function public.handle_new_user() from public");
    expect(sql).toContain("revoke all on function public.handle_new_user() from anon");
    expect(sql).toContain("revoke all on function public.handle_new_user() from authenticated");
    expect(sql).toContain("revoke all on function public.delete_own_account() from public");
    expect(sql).toContain("revoke all on function public.delete_own_account() from anon");
    expect(sql).toContain("grant execute on function public.delete_own_account() to authenticated");
  });

  it("indexa las claves ajenas sueltas y reescribe las políticas con select auth.uid()", () => {
    expect(sql).toContain("create index if not exists notas_user_id_idx on public.notas (user_id)");
    expect(sql).toContain("create index if not exists sala_miembros_user_id_idx on public.sala_miembros (user_id)");
    expect(sql.match(/\(select auth\.uid\(\)\)/g)?.length).toBe(18);
    for (const nombre of politicas) {
      expect(sql).toContain(`drop policy if exists "${nombre}"`);
      expect(sql).toContain(`create policy "${nombre}"`);
    }
    expect(sql).toContain('create policy "update own notes"');
    expect(sql).not.toContain("create policy \"insert own room\"");
    expect(sql).toContain("revoke insert, update, delete on table public.subscription_status from authenticated");
  });
});
