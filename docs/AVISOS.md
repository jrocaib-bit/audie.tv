# Avisos

Los avisos de esta versión son notificaciones locales (`expo-notifications`). El teléfono las dispara a la hora elegida, en los días elegidos, sin servidor. Se pueden apagar en Ajustes. El texto es del tipo «Te toca Génesis 3».

No hay push remoto. Para añadirlo haría falta, y aquí no está:

- una cuenta de Apple Developer y una clave APNs
- un proyecto Firebase y la clave FCM
- un token de Expo Push por instalación
- un servidor que envíe el mensaje
- una cuenta de persona, que Audite todavía no tiene

Hasta entonces no se registra ningún token ni se llama a un servicio de push.
