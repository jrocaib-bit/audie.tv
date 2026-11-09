import { proximosAvisos, type PlanAviso } from "@audite/domain";
import * as Notifications from "expo-notifications";

export async function programarAvisosLocales(plan: PlanAviso, texto: string): Promise<number> {
  const permiso = await Notifications.getPermissionsAsync();
  const concedido = permiso.granted || (await Notifications.requestPermissionsAsync()).granted;
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!concedido || !plan.activo) return 0;
  const pendientes = proximosAvisos(plan, new Date(), texto);
  for (const aviso of pendientes) {
    await Notifications.scheduleNotificationAsync({
      content: { title: "Audite", body: aviso.texto, sound: false },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(aviso.en) },
    });
  }
  return pendientes.length;
}
