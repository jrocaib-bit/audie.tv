# Fuentes

Gazpacho no se versiona. La licencia sigue pendiente.

Si `GAZPACHO_FONTS_URL` apunta a una carpeta privada con `Gazpacho-Regular.otf` y `Gazpacho-Heavy.otf`, `scripts/gazpacho.mjs` los baja al construir y los convierte a WOFF2 con `wawoff2`. El CSS solo referencia esos `.woff2`, en `apps/web/public/fonts/gazpacho/`, carpeta ignorada por git.

Si la variable no está, si la descarga falla o si no se puede convertir, el script avisa y sale sin error. La web no pide la fuente y el texto usa Georgia. No se versiona ningún archivo de fuente.
