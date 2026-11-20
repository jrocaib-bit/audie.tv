import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

/** Píldora de 48 px. Una sola «oro» por pantalla: relleno #E0C48A, texto #100E0C. */
export const botonOroVariantes = cva(
  "sala-boton inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-base font-semibold whitespace-nowrap disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variante: {
        oro: "bg-[#E0C48A] text-[#100E0C] hover:bg-[#C9A96E]",
        secundario: "border border-[#2E2924] bg-[#1B1815] text-[#F4ECE2] hover:bg-[#2E2924]/60",
        fantasma: "border border-[#F4ECE2]/30 bg-transparent text-[#F4ECE2] hover:bg-[#F4ECE2]/10",
      },
    },
    defaultVariants: { variante: "oro" },
  },
);

export type BotonOroProps = React.ComponentProps<"button"> & VariantProps<typeof botonOroVariantes> & { asChild?: boolean };

export function BotonOro({ className, variante, asChild = false, ...props }: BotonOroProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(botonOroVariantes({ variante }), className)} {...props} />;
}
