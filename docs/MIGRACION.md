# Audite en GitHub y en Supabase

Este repositorio (`jrocaib-bit/audie.tv`) es la casa del código. El proyecto de Supabase dedicado a Audite ya está creado. Este árbol no se conecta a él: no aplica migraciones, no guarda claves y no despliega.

No hay pagos. La tabla `subscription_status` solo guarda un estado (`none`, `pending`, `active`, `inactive`). No conectes Stripe ni otro proveedor como parte de este traslado.

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

Cuando se decida conectar la base, y no antes:

1. En el SQL editor de ese proyecto, ejecuta `supabase/migrations/20261109120000_listening.sql`. No reutilices otra base.
2. Copia la clave anónima a `NEXT_PUBLIC_SUPABASE_ANON_KEY`. La URL ya está en `.env.example`.
3. La clave `service_role` queda solo en el servidor, en `SUPABASE_SERVICE_ROLE_KEY`. No la pongas en la web ni en Expo.
4. El código de `@audite/data` sabe hablar con Supabase, pero la app todavía no lo llama. El avance sigue en el dispositivo.
5. `createSupabasePorts` no hace nada si la URL o la clave están vacías: lanza un error y no abre una conexión.

## Lo que no hay que hacer en este paso

- No aplicar la migración ni crear usuarios.
- No activar pagos, precios ni webhooks.
- No desplegar la web ni enviar la app a una tienda.
- No enlazar Vercel, Stripe ni otra cuenta desde este repositorio.
