# Fuentes

Gazpacho no se versiona. La licencia sigue pendiente.

Si `GAZPACHO_FONTS_URL` apunta a una carpeta privada con `Gazpacho-Regular.otf` y `Gazpacho-Heavy.otf`, `scripts/gazpacho.mjs` los baja al construir, a `apps/web/public/fonts/gazpacho/`, carpeta ignorada por git. Ahí se escribe `faces.css`.

Si la variable no está, el script no hace nada y la web no pide `/fonts/private`. El texto usa Georgia.

No conviertas a woff2 en el repositorio. Si el entorno tiene `woff2_compress`, se puede convertir en ese directorio de build; el CSS publicado solo existe cuando la descarga ha funcionado.
