# Alta

Proyecto Supabase `qdjowihivtqoelurvyke` (`https://qdjowihivtqoelurvyke.supabase.co`).
Las migraciones y `supabase/config.toml` están escritas y no aplicadas.
No hay cobro.

## URLs

- Sitio: `https://audite.tv`
- Callback web: `https://audite.tv/auth/callback`
- Callback de la app: `audite://auth/callback`
- Remitente previsto: `no-reply@audite.tv`

## Panel de Supabase

Authentication → URL Configuration:

- Site URL: `https://audite.tv`
- Redirect URLs: `https://audite.tv/auth/callback` y `audite://auth/callback`

Authentication → Providers:

- Apple: Services ID de `AUDITE_APPLE_SERVICES_ID`, secret de `AUDITE_APPLE_SECRET`.
- Google: Client ID de `AUDITE_GOOGLE_CLIENT_ID`, secret de `AUDITE_GOOGLE_CLIENT_SECRET`.
- Email: enlace mágico. Plantillas en `supabase/templates/magic-link/`.

Authentication → Emails → SMTP (Resend):

- Host `smtp.resend.com`, puerto `465`, usuario `resend`, remitente `no-reply@audite.tv`.
- La contraseña es la API key de Resend. No va en el repositorio.

## Apple

- App ID con Sign in with Apple.
- Services ID = `AUDITE_APPLE_SERVICES_ID`.
- Return URL: `https://qdjowihivtqoelurvyke.supabase.co/auth/v1/callback`.
- Key ID `AUDITE_APPLE_KEY_ID`, Team ID `AUDITE_APPLE_TEAM_ID`. Con esos datos se firma el secret que pide Supabase.
- En la app, el client id nativo es `AUDITE_APPLE_BUNDLE_ID`.

## Google

- Cliente web: `AUDITE_GOOGLE_CLIENT_ID`.
- Cliente iOS: `AUDITE_GOOGLE_IOS_CLIENT_ID`.
- Authorized redirect URI: `https://qdjowihivtqoelurvyke.supabase.co/auth/v1/callback`.
- Orígenes: `https://audite.tv`.

## Qué hace el código

- Web: OAuth de Apple y Google, y `signInWithOtp` al correo.
- App: `expo-apple-authentication` y el `id_token` de Google entran con `signInWithIdToken`.
- La sesión se guarda. Hay cierre y borrado de cuenta (`delete_own_account`).
- El primer login sube favoritos, notas y progreso locales.
- Sin cuenta la app se usa igual. El muro de suscripción no está.
