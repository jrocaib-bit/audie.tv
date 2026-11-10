# Despliegue de la web

Proyecto nuevo de Vercel. No reutilices otro. Este documento no despliega nada.

## Proyecto

- Directorio raíz: `apps/web`
- Framework: Next.js
- Instalación: `npm install --prefix ../..`
- Build: `npm run build --prefix ../.. -w @audite/web`
- Salida: la de Next.js, el directorio `.next` de `apps/web`. No hay export estático.

`apps/web/vercel.json` deja esos comandos escritos.

## Variables

Nombres, sin valores secretos:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` — si está vacía, no se carga Plausible
- `SUPABASE_SERVICE_ROLE_KEY` solo en el servidor
- `RESEND_API_KEY` solo en el servidor. No envía correos por sí sola.

La URL pública del proyecto de Supabase puede ir en `.env.example`. Las claves se quedan vacías.
