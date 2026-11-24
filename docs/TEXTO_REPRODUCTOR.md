# Texto en el reproductor

El reproductor puede mostrar el texto del episodio junto al audio, con el versículo que suena resaltado. La web lo pinta en `/ahora` y la app en la pantalla Ahora.

## Aviso de derechos

El texto de la CEE nunca entra en este repositorio. El repositorio es público.

El panel muestra la traducción de Torres Amat, de dominio público, versionada en `content/texto/torres-amat/` (ver `FUENTE.md` en esa carpeta). Cada episodio con texto lleva el aviso fijo «Texto: Torres Amat (dominio público). Puede no coincidir palabra por palabra con el audio». El interruptor `TEXTO_BIBLICO_ACTIVO` sigue apagado por defecto y encenderlo en producción necesita el visto bueno de Javier.

La licencia de la CEE no consta archivada y no está confirmado que cubra mostrar el texto en pantalla. Por eso la función queda apagada por defecto. No actives `TEXTO_BIBLICO_ACTIVO` en producción hasta tener la licencia archivada y la confirmación por escrito de que cubre la lectura en pantalla en web y app.

Los tests y la muestra usan texto inventado. Un test recorre `git ls-files` y falla si un fichero versionado lleva `"versiculos"` con un campo `texto` de más de 30 caracteres. Quedan fuera los ficheros `*.test.*`, con frases inventadas, y los de `content/texto/torres-amat/es/`, siempre que declaren `fuente: "torres-amat"` y `muestra: false`.

## Formato

Un fichero por episodio e idioma. Nombre relativo `<idioma>/<idEpisodio>.json`, por ejemplo `es/gn-01.json`.

```json
{
  "version": 1,
  "episodio": "gn-01",
  "idioma": "es",
  "muestra": false,
  "fuente": "nombre de la edición",
  "credito": "texto del crédito legal",
  "versiculos": [
    { "ref": "1,1", "cap": 1, "v": "1", "texto": "...", "t": 10.2 }
  ]
}
```

- `episodio` cumple `^[a-z0-9-]{2,24}$` y coincide con el nombre del fichero. `idioma` es `es` o `en` y coincide con la carpeta.
- `v` es cadena porque puede ser `5a`.
- `t` es opcional. Es el segundo de inicio del versículo en la línea de tiempo del máster.
- Con `t` en al menos el 80 % de los versículos, el panel está sincronizado: resalta, se desplaza solo y deja tocar para saltar. Por debajo, muestra el texto entero sin sincronizar.
- `muestra: true` pinta el aviso «Texto de ejemplo, no es una edición bíblica».
- `fuente: "torres-amat"` con `muestra: false` pinta el aviso fijo de Torres Amat arriba del panel y no repite el crédito al pie. No aparece «Texto de ejemplo».
- El servidor valida con un esquema zod estricto (`apps/web/src/lib/texto/esquema.ts`). Rechaza claves de más, tipos rotos y ficheros de otro episodio o idioma.

## Variables

| Variable | Dónde | Uso |
| --- | --- | --- |
| `TEXTO_BIBLICO_ACTIVO` | servidor web | Interruptor maestro. Solo `1` lo enciende. Sin él, `/api/texto/<id>` responde 404 y ninguna interfaz pinta el panel. |
| `TEXTO_ACCESO` | servidor web | `como-audio` (por defecto), `suscripcion` o `abierto`. |
| `TEXTO_FUENTE` | servidor web | `torres-amat` (por defecto) lee `content/texto/torres-amat`. `ninguna` no lee nada del repositorio. |
| `AUDITE_TEXTO_RUTA` | servidor web, solo local | Carpeta con `<idioma>/<id>.json`. Nunca en producción. Tiene prioridad sobre `TEXTO_FUENTE`. |
| `TEXTO_BUCKET` | servidor web, futuro | Nombre del bucket privado. Sin implementar. |

## Acceso

`GET /api/texto/<id>?lang=es`

- `como-audio`: mismas reglas que el audio del episodio. Reutiliza `esAudioGratis` y `puedeEscuchar` de `lib/audio-acceso.ts` y el origen de sesión de `lib/sesion-servidor.ts`, el mismo que usa `/api/audio/<id>`. Quien puede escuchar, puede leer.
- `suscripcion`: hace falta sesión y `subscription_status = active`, también en episodios de audio gratis.
- `abierto`: sin comprobación. Solo para pruebas.

Respuestas:

- 200 con el JSON validado y `sincronizado`. Cabeceras `Cache-Control: private, no-store` y `X-Robots-Tag: noindex`.
- 401 `sin-sesion`, 403 `sin-permiso`, 404 `no-encontrado` (función apagada o id inválido) y 404 `sin-texto` (episodio sin fichero), todas con `Cache-Control: no-store`.
- 503 `no-disponible` si falta configuración de Supabase o el fichero no pasa el esquema.

Ni las respuestas ni los logs llevan rutas del disco. El log solo dice el nombre relativo, por ejemplo `[texto] fichero fuera de esquema: es/gn-01.json`.

El cliente manda el mismo `Authorization: Bearer <token>` que el audio. La web lo toma de la sesión de Supabase y la app de su sesión.

## Desarrollo

Con `NODE_ENV` distinto de `production`:

- `?mock=gratis` o `?mock=premium` en la API, o la cabecera `x-texto-mock`, simulan una cuenta sin suscripción o con ella. En producción se ignoran.
- En `/ahora`, `?mock=` se reenvía a la API como cabecera.
- `/ahora?sim=1` avanza el reloj del reproductor sin audio para ver el resaltado en capturas y vídeo. `&texto=gn-01` fija el episodio del texto. En producción no hace nada.

Arranque de prueba con la muestra:

```sh
AUDITE_DEMO=1 TEXTO_BIBLICO_ACTIVO=1 TEXTO_ACCESO=abierto \
AUDITE_TEXTO_RUTA=/ruta/a/texto-reproductor-muestra \
npm run dev -w @audite/web -- --port 43125
# http://localhost:43125/ahora?sim=1&texto=gn-01
```

La muestra vive fuera del repo, con texto inventado y `muestra: true`.

## Cobertura de Torres Amat

Con 516 episodios en el manifiesto, 425 llevan texto y 91 quedan sin él. 104 episodios llevan resaltado por versículo, que son los 104 de los 110 con transcripción cuyo texto está completo en la fuente. Los otros 321 muestran el rango sin resaltado. El motivo de cada episodio sin texto está en `content/texto/torres-amat/cobertura.json`.

Torres Amat sigue la Vulgata. En 139 capítulos el número de versículos difiere del de la CEE. El generador mapea esos casos con grupos de capítulos de igual suma de versículos y, si no puede, deja el episodio sin texto. Los Salmos llevan la numeración hebrea, no la de la edición impresa.

## Cómo se genera el fichero privado

El fichero sale de dos fuentes que ya existen fuera del repo:

1. El texto por versículos de la edición con licencia, en la caché privada de fuentes. Da `cap`, `v` y `texto`.
2. Las alineaciones del audio: transcripción automática del máster por segmentos con su segundo de inicio.

El proceso, en un script privado fuera del repo:

- Toma el rango del episodio del manifiesto y lista sus versículos.
- Normaliza texto y transcripción (minúsculas, sin tildes, solo palabras) y busca el ancla de cada versículo en la secuencia de segmentos.
- Asigna a cada versículo el segundo del segmento donde empieza. Si un versículo no tiene ancla, lo deja sin `t`.
- Escribe `<idioma>/<id>.json` con `version`, `episodio`, `idioma`, `muestra: false`, `fuente`, `credito` y `versiculos`.
- Valida cada fichero con el esquema antes de subirlo.

Los tiempos son estimados, porque la transcripción da segmentos de pocos segundos. Para el panel basta.

## Producción: bucket privado (diseño, sin implementar)

Nada de esto existe todavía. No hay bucket creado ni migración.

- Bucket de Supabase Storage `texto` (o el valor de `TEXTO_BUCKET`). Privado, sin políticas públicas ni de usuarios autenticados. Solo la service role lee.
- Mismos nombres relativos que en disco: `es/gn-01.json`.
- `lib/texto/almacen.ts` genera en servidor una URL firmada de 60 s con la service role, la descarga él mismo y la descarta. La URL nunca llega al cliente ni a los logs.
- Caché en memoria por instancia con TTL de 10 minutos para aciertos y 30 s para fallos, con deduplicación de peticiones en vuelo.
- El JSON descargado pasa por el mismo esquema estricto.
- La ruta sigue aplicando el acceso antes de leer, así que el bucket solo se toca para quien puede leer.

## Ficheros

- `packages/domain/src/texto-panel.ts`: tipos, versículo actual por búsqueda binaria, sincronía, preferencias, paleta y textos.
- `apps/web/src/lib/texto/`: esquema, almacén, acceso y simulación (solo servidor salvo `simulacion.ts`).
- `apps/web/src/lib/sesion-servidor.ts`: origen de sesión compartido por audio y texto.
- `apps/web/src/app/api/texto/[id]/route.ts`: la ruta.
- `apps/web/src/components/v2/panel-texto.tsx`: panel web.
- `apps/mobile/src/panel-texto.tsx` y `apps/mobile/src/texto.ts`: panel de la app y carga desde `EXPO_PUBLIC_CONTENT_BASE` + `/api/texto/<id>` con el token de la sesión.
