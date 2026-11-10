# Audite en GitHub y en Supabase

Este repositorio (`jrocaib-bit/audie.tv`) es la casa del código. El proyecto de Supabase dedicado a Audite ya está creado. Este árbol no se conecta a él: no aplica migraciones, no guarda claves y no despliega.

La web no cobra. La app tiene StoreKit detrás de `PURCHASES_ENABLED`, apagado. La tabla `subscription_status` sigue siendo un estado (`none`, `pending`, `active`, `inactive`).

## GitHub

1. El código vive en este repositorio. No hace falta crear otro.
2. No subas `.env`, claves, másteres de audio, imágenes grandes ni el texto bíblico. Esos ficheros están fuera del árbol y en `.gitignore`.
3. `.env.example` lleva la URL del proyecto y las claves vacías. Las claves reales van en el entorno del servidor, no en git.
4. El modo demo (`AUDITE_DEMO=1`) sigue siendo aparte. El catálogo que lee la web es `content/canon`. El fichero `content/demo/catalogo-app.json` no está en el repositorio público.

## Supabase

Proyecto nuevo, solo de Audite:

- Referencia: `qdjowihivtqoelurvyke`
- URL: `https://qdjowihivtqoelurvyke.supabase.co`
- Región: `eu-west-1`
- `project_id` en `supabase/config.toml`

Ya aplicadas en producción: `20261109120000_listening.sql`, `20261109183000_notas_favoritos.sql`, `20261109190000_salas.sql`, `20261110120000_auth_cuenta.sql`, `20261110130000_endurecer.sql`, `20261110220000_analytics.sql`, `20261110221000_delete_my_account.sql` y `20261110222000_email_preferencias.sql`.

Escrita y sin aplicar: `20261110223000_drop_delete_own_account.sql`.

Cuando se decida aplicar una migración nueva, y no antes:

1. En el SQL editor de ese proyecto, ejecuta el fichero que falte. No reutilices otra base.
2. Copia la clave anónima a `NEXT_PUBLIC_SUPABASE_ANON_KEY`. La URL ya está en `.env.example`.
3. La clave `service_role` queda solo en el servidor, en `SUPABASE_SERVICE_ROLE_KEY`. No la pongas en la web ni en Expo.
4. El código de `@audite/data` sabe hablar con Supabase, pero la app todavía no lo llama. El avance sigue en el dispositivo.
5. `createSupabasePorts` no hace nada si la URL o la clave están vacías: lanza un error y no abre una conexión.

## Lo que no hay que hacer en este paso

- No aplicar la migración ni crear usuarios.
- No activar pagos, precios ni webhooks.
- No desplegar la web ni enviar la app a una tienda.
- No enlazar Vercel, Stripe ni otra cuenta desde este repositorio.

## Fuentes

Inter (OFL) va en el repositorio. Gazpacho no: cópialo, si Javier confirma la licencia, a `apps/web/public/fonts/private/` y `apps/mobile/assets/fonts/private/`. Esas carpetas están en `.gitignore`. SF Pro no se copia nunca: en iOS se usa la del sistema (`--audite-font-ios-system`).
