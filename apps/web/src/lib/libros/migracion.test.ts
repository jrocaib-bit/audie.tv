import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(path.resolve(import.meta.dirname, "../../../../../supabase/migrations/20261124120000_libros.sql"), "utf8");
const TABLAS = ["libros", "libros_capitulos", "libros_referencias", "libros_progreso", "libros_marcadores", "libros_subrayados", "libros_notas"];

describe("migración de libros (sin aplicar)", () => {
  it("activa RLS en todas las tablas", () => {
    for (const tabla of TABLAS) expect(sql).toContain(`alter table public.${tabla} enable row level security;`);
  });
  it("json_contenido y el enlace de Kindle quedan fuera de los privilegios de columna del cliente", () => {
    const concesiones = sql.split("\n").filter((linea) => /^grant select \(/.test(linea) || /^\s+on public\.libros(_capitulos)? to anon/.test(linea)).join("\n");
    expect(concesiones).not.toContain("json_contenido");
    expect(concesiones).not.toContain("amazon_kindle_url");
    expect(sql).toContain("revoke all on table public.libros_capitulos from anon, authenticated;");
  });
  it("el contenido solo sale por la función con adelanto o suscripción activa", () => {
    expect(sql).toContain("security definer");
    expect(sql).toMatch(/c\.es_adelanto\s+or exists/);
    expect(sql).toContain("s.status = 'active'");
  });
  it("las tablas de usuario son de cada cual y llevan los índices pedidos", () => {
    expect(sql.match(/auth\.uid\(\) = user_id/g)?.length).toBeGreaterThanOrEqual(13);
    expect(sql).toContain("primary key (user_id, libro_id)");
    expect(sql).toContain("on public.libros_referencias (episodio_id)");
    expect(sql).toContain("on public.libros_referencias (libro_id, escritura_libro_id)");
  });
  it("no inserta manuscritos", () => {
    expect(sql).not.toMatch(/insert into/i);
  });
});
