import "server-only";

/**
 * Fuente única del derecho «premium» para La sala (solo servidor).
 *
 * Se apoya en la fuente que ya existe: la tabla `subscription_status` (`LibraryPort.getSubscription`,
 * ruta de audio) y su `status` (`SubscriptionState = "none" | "pending" | "active" | "inactive"`).
 * Igual que `puedeEscuchar` con `AUDIO_ACCESO=suscripcion`, solo `"active"` da derecho.
 *
 * - No existe columna ni estado `trialing`. Si la prueba de 7 días se guarda como `"active"` mientras el
 *   derecho está vigente (lo habitual), cuenta como premium. `"pending"` NO se considera premium
 *   (no está documentado como prueba). No se cambia el esquema ni Stripe.
 * - Todo lo demás (sin fila, `"none"`, `"inactive"`, desconocido, null, sin sesión) es false.
 * - La lista de internos (`AUDIO_EMAILS_PERMITIDOS`) es un modo de audio y NO cuenta aquí.
 */
export function esPremium(estado: { status?: string | null } | null | undefined): boolean {
  return estado?.status === "active";
}
