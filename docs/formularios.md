# Formularios

La web escribe en Supabase con `SUPABASE_SERVICE_ROLE_KEY`. Las tablas nuevas tienen RLS y ninguna política para anon ni authenticated. La service role no pasa por esas políticas.

No se aplica la migración desde aquí.

## Variables

Nombres, sin valores:

- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `SOPORTE_DESTINO`
- `SOPORTE_ACUSE`
- `CORREO_ENVIO_REAL`
- `CORREO_DESTINOS_PERMITIDOS`
- `IP_HASH_SALT`
- `STORES_LIVE`
- `GOOGLE_LOGIN_ENABLED`
- `NEXT_PUBLIC_SITE_URL`
- `GAZPACHO_FONTS_URL`

`CORREO_ENVIO_REAL` tiene que ser `true` para enviar. Si no, el servidor anota el correo y responde como si hubiera salido.

`CORREO_DESTINOS_PERMITIDOS` es una lista separada por comas de direcciones exactas o dominios (`@resend.dev`). Con el envío real encendido, cada correo sale solo si todos los destinatarios están en esa lista. Si la lista está vacía, fuera de producción no se envía nada; en producción se mantiene el envío de ahora.

`STORES_LIVE` tiene que ser `true` para mostrar App Store y Google Play.

## Tablas

- `mensajes_soporte`
- `suscripciones_correo` (`boletin` y `lanzamiento_app`)
- `limites_envio`

Migraciones, escritas y no aplicadas:

- `supabase/migrations/20261110240000_formularios.sql`
- `supabase/migrations/20261110241000_consumir_limite.sql` (upsert atómico del límite; si la función aún no está, el servidor consulta solo la clave y la ventana)

Si `CORREO_ENVIO_REAL` no es `true`, Avísame y la lista responden «Te avisaremos.» y no dicen que salió un correo.

`/correo/confirmar` y `/correo/baja` muestran un botón en GET. La acción es un POST. El POST con `List-Unsubscribe=One-Click` da de baja al momento (RFC 8058). Un token que no corresponde a ninguna lista responde con un error claro.

## Flujo

El soporte guarda el mensaje y lo manda a `SOPORTE_DESTINO`. El acuse al remitente solo sale si `SOPORTE_ACUSE` es `true`.

El boletín y el aviso de la app quedan en `pendiente` y envían `/correo/confirmar?t=`. Al confirmar, el estado pasa a `confirmada` con `consent_at`, el hash de la IP y la versión de la política. El token caduca a los 7 días.

`/correo/baja` da de baja esas listas y también llama a `unsubscribe_by_token`. El POST de un clic sigue el RFC 8058.

Un campo oculto con texto, o un envío en menos de 3 segundos, se descarta y se muestra el mismo éxito. Hay tope de 5 por hash de IP a la hora y 3 por correo al día.

El formulario de contacto está en `/{lang}/contacto` (`/es/contacto`). `/contacto` redirige ahí. `/ayuda` y el pie enlazan esa ruta.

`GOOGLE_LOGIN_ENABLED` tiene que ser `true` para mostrar el botón de Google y la viñeta correspondiente en la ayuda. Por defecto no se muestra.

Con `CORREO_ENVIO_REAL` distinto de `true` no sale ningún correo real.

## Eventos

| Evento | form_id | cta_id | Dónde |
|---|---|---|---|
| `cta_clicked` | `alta_entrar` | `alta_apple`, `alta_google`, `alta_magic_link` | Alta web y app |
| `form_submitted` | `alta_entrar` | `alta_magic_link` | Enlace mágico con correo válido |
| `signup_confirmed` | `alta_entrar` | `alta_apple`, `alta_google`, `alta_magic_link` | Sesión creada |
| `cta_clicked` | `avisame_app` | `avisame_abrir`, `avisame_enviar` | Aviso de la app |
| `form_submitted` | `avisame_app` | `avisame_enviar` | El servidor acepta el aviso |
| `cta_clicked` | `soporte` | `soporte_enviar`, `mailto_soporte` | Contacto y enlaces mailto |
| `form_submitted` | `soporte` | `soporte_enviar` | El servidor acepta el contacto |
| `cta_clicked` | `lista_correo` | `lista_enviar` | Boletín del pie |
| `form_submitted` | `lista_correo` | `lista_enviar` | El servidor acepta el boletín |
| `signup_confirmed` | `lista_correo` | `confirmar` | Doble opt-in en `/correo/confirmar` |

No viajan correo, nombre ni el texto del mensaje. `analytics_events` ya admite estos nombres: no hace falta otra migración.
