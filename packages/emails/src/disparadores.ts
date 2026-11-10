/**
 * Inactividad: 7 o 14 días desde el último playback_started o la última fila de listening_days,
 * y solo mientras la cuenta sigue teniendo acceso.
 * Recuperación: 3 días después de cancelar. El plazo sigue pendiente de confirmación de Javier.
 * Nada de esto está programado. No se envía ningún correo hasta que Javier lo autorice.
 */
export const DIAS_INACTIVIDAD = [7, 14] as const;
export const DIAS_RECUPERACION_TRAS_CANCELAR = 3;
