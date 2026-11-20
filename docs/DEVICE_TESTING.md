# Probar Audite en un teléfono

El identificador de la app es `tv.audite.app` en iOS y en Android. El audio y el catálogo se piden a `EXPO_PUBLIC_CONTENT_BASE`, que por defecto es `https://audite.tv`.

## Cuentas que harían falta más adelante

Solo para cuando decidas salir de este borrador. No las abras como parte de esta prueba.

| Paso | Cuenta |
| --- | --- |
| Expo Go | Ninguna. La app de Expo Go ya instalada basta para abrir el proyecto en desarrollo. |
| Build de desarrollo con EAS | Una cuenta de Expo, y el proyecto asociado. |
| Instalar el build en un iPhone | Esa cuenta de Expo y un equipo de Apple Developer. |
| Instalar el build en Android | Esa cuenta de Expo. Una cuenta de Google Play solo hace falta para publicar, no para un build interno. |
| App Store o Google Play | Cuentas de Apple y de Google, más el alta de la ficha. No forman parte de esta prueba. |
| Pagos | Ninguna. No hay proveedor de pago. |

## Expo Go

En el ordenador, dentro de `apps/mobile`:

```bash
npm install
npx expo start
```

En la raíz del repositorio, en otra terminal:

```bash
npm run dev
```

Abre Expo Go y escanea el código. El teléfono y el ordenador tienen que verse en la red. Si el audio o el catálogo no cargan, indica la IP del ordenador:

```bash
EXPO_PUBLIC_CONTENT_BASE=http://192.168.0.10:43123 npx expo start
```

Sustituye esa IP por la de tu máquina. El modo demo (`EXPO_PUBLIC_AUDITE_DEMO=1`) es aparte y no es el catálogo real.

## Build de desarrollo

`eas.json` tiene `development`, `preview` y `production`. El perfil `production` es el de TestFlight (tienda, `autoIncrement`, canal `production`). El submit de iOS apunta a la ficha `6833136641` y al bundle `tv.audite.app`. La clave de App Store Connect no va en el repo: `ASC_API_KEY_PATH`, `ASC_API_KEY_ID` y `ASC_API_KEY_ISSUER_ID` se leen al enviar. `EAS_PROJECT_ID` rellena `extra.eas.projectId` si existe. Cada build instala primero la raíz del monorepo, porque `apps/mobile` no está en los workspaces.

`development` se abre con el cliente de desarrollo. `preview` es una instalación interna. `production` es el build de tienda que se envía a TestFlight.

## Lista de comprobación

Hazla en un iPhone y en un Android, con Expo Go o con el build de desarrollo. Anota el aparato y el sistema.

- La app abre en Hoy, Camino, Biblioteca y Ajustes, en claro y en oscuro.
- El texto crece si el sistema usa un tamaño grande, y se puede leer sin que los botones se salgan.
- Los controles del reproductor y las pestañas se pueden pulsar con el dedo y el lector de pantalla dice su nombre.
- Con «reducir movimiento» activado, la obra no se desplaza.
- Reproducir, pausar y buscar funcionan en un episodio que tenga audio. Hoy el manifiesto no tiene máster listo: la escucha debe decir que está en preparación, no inventar sonido.
- El audio sigue al bloquear la pantalla y al pasar la app a segundo plano, cuando haya un episodio reproducible.
- La pantalla de bloqueo muestra el título y permite pausar.
- El temporizador de sueño detiene el audio al cumplirse.
- Al salir y volver, la posición se retoma en este aparato.
- Sin red, no aparece un episodio que el manifiesto no tenga en el dispositivo. La caché no debe fingir audio.
- El crédito del texto coincide con `fuente_texto` de ese idioma. Si el idioma no tiene crédito, se lee como pendiente.

## Lo que esta guía no cubre

No se ha hecho esta prueba en un teléfono desde el entorno donde se escribió el borrador. No hay envío a tiendas ni pagos.
