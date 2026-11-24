import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(path.resolve(import.meta.dirname, "../../../../../supabase/migrations/20261124120000_libros.sql"), "utf8");
const TABLAS = ["libros", "libros_capitulos", "libros_referencias", "libros_progreso", "libros_marcadores", "libros_subrayados", "libros_notas"];

describe("migración de libros (aplicada)", () => {
  it("activa RLS en todas las tablas", () => {
    for (const tabla of TABLAS) expect(sql).toContain(`alter table public.${tabla} enable row level security;`);
  });
  it("json_contenido y el enlace de Kindle quedan fuera de los privilegios de columna del cliente", () => {
    const concesiones = sql.split("\n").filter((linea) => /^grant select \(/.test(linea) || /^\s+on public\.libros(_capitulos)? to anon/.test(linea)).join("\n");
    expect(concesiones).not.toContain("json_contenido");
    expect(concesiones).not.toContain("amazon_kindle_url");
    expect(sql).toContain("revoke all on table public.libros_capitulos from anon, authenticated;");
  });
  it("las políticas del catálogo y de lectura pública excluyen borradores", () => {
    expect(sql).toContain("to anon, authenticated\n  using (estado in ('completo', 'publicado'))");
    expect(sql).toContain("grant execute on function public.libros_capitulo_contenido(text, text) to anon, authenticated;");
    expect(sql).toContain("revoke all on function public.libros_capitulo_contenido(text, text) from public;");
  });
  it("el contenido solo sale por la función con adelanto o suscripción activa", () => {
    expect(sql).toContain("security definer");
    expect(sql).toMatch(/c\.es_adelanto\s+or exists/);
    expect(sql).toContain("s.status = 'active'");
  });
  it("las tablas de usuario son de cada cual y llevan los índices pedidos", () => {
    // 4 tablas de usuario: progreso (4 políticas), marcadores (3), subrayados (4), notas (4). Todas a authenticated.
    const politicas = sql.split("\n").filter((linea) => /^create policy "(read|insert|update|delete) own libros /.test(linea));
    expect(politicas).toHaveLength(15);
    for (const linea of politicas) {
      expect(linea).toContain(" to authenticated ");
      expect(linea).toContain("(select auth.uid()) = user_id");
      expect(linea).not.toMatch(/\sto anon/);
    }
    expect(sql).toContain("revoke all on table public.libros_progreso, public.libros_marcadores, public.libros_subrayados, public.libros_notas from anon;");
    expect(sql).not.toMatch(/(using|check) \(auth\.uid\(\)/);
    expect(sql).toContain("primary key (user_id, libro_id)");
    expect(sql).toContain("on public.libros_referencias (episodio_id)");
    expect(sql).toContain("on public.libros_referencias (libro_id, escritura_libro_id)");
    for (const indice of ["libros_referencias (capitulo_id)", "libros_capitulos (libro_id)", "libros_progreso (libro_id)", "libros_marcadores (libro_id)", "libros_subrayados (libro_id)", "libros_notas (libro_id)", "libros_notas (subrayado_id)"]) expect(sql).toContain(`on public.${indice}`);
    for (const tabla of ["marcadores", "subrayados", "notas"]) expect(sql).toContain(`on public.libros_${tabla} (user_id, libro_id)`);
  });
  it("no inserta manuscritos", () => {
    expect(sql).not.toMatch(/insert into/i);
  });
});
