import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Cabecera + scroll-snap horizontal. El vecino asoma ~16 px. */
export function Rail({ titulo, verTodo, className, children, cartel = false, rejilla = false }: { titulo: string; verTodo?: { href: string; etiqueta: string }; className?: string; children: ReactNode; cartel?: boolean; rejilla?: boolean }) {
  return (
    <section className={cn("mx-auto w-full max-w-6xl px-5 py-10 md:px-8", className)}>
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-display t-h2">{titulo}</h2>
        {verTodo ? <Link href={verTodo.href} className="inline-flex min-h-11 items-center text-sm text-[#B7AB9C] underline">{verTodo.etiqueta}</Link> : null}
      </div>
      <ul className={cn("sala-rail mt-5", cartel && "sala-rail-cartel", rejilla && "sala-rail-grid")}>{children}</ul>
    </section>
  );
}
