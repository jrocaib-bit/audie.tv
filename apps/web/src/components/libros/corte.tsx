import Link from "next/link";
import { PRECIO, hrefEntrarParaLibros, type VistaLector } from "@audite/domain";

/** Tarjeta de corte. «Entrar» solo sin sesión. Con cuenta gratuita, solo la prueba. */
export function CorteLibro({ lang, vista, rutaLector, tipo, titulo }: { lang: string; vista: VistaLector; rutaLector: string; tipo: "fin-adelanto" | "capitulo"; titulo?: string }) {
  return (
    <section data-corte={tipo} data-vista={vista} aria-labelledby="corte-titulo" className="lector-aparece mt-14 max-w-xl rounded-3xl border border-[var(--lector-linea)] bg-[var(--lector-tarjeta)] px-6 py-8">
      <p className="text-sm tracking-[0.16em] text-[var(--lector-acento)] uppercase">{titulo ?? "Audite Premium"}</p>
      <h2 id="corte-titulo" className="font-display mt-3 text-4xl leading-none">El libro sigue aquí</h2>
      <p className="mt-4 text-[var(--lector-suave)]">
        {vista === "gratuito"
          ? "Tu cuenta ya está creada. Con la suscripción, el libro entero se abre y tus notas lo acompañan."
          : "El resto del libro se abre con la suscripción de Audite. Prueba 7 días gratis y sigue leyendo donde lo dejaste."}
      </p>
      <p className="mt-2 text-sm text-[var(--lector-suave)]">Después, {PRECIO.anio} al año o {PRECIO.mes} al mes.</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href={`/${lang}/membresia`} data-accion="prueba" className="inline-flex min-h-12 items-center rounded-full bg-[#C9A96E] px-6 text-[#100E0C]">Prueba {PRECIO.pruebaDias} días gratis</Link>
        {vista === "sin-sesion" ? (
          <Link href={hrefEntrarParaLibros(lang, rutaLector)} data-accion="entrar" className="inline-flex min-h-12 items-center rounded-full border border-[var(--lector-linea)] px-6">Entrar</Link>
        ) : null}
      </div>
    </section>
  );
}
