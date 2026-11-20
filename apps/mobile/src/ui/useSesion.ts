import type { Sesion } from "@audite/domain";
import { useMobileLibrary } from "../state";

/** Sesión actual (null sin cuenta), siempre al día con Supabase. */
export function useSesion(): Sesion | null {
  return useMobileLibrary().sesion;
}
