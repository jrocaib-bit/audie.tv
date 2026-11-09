# Reproducción en segundo plano

Se usa `expo-audio`, que ya viene con el SDK de la app. Publica la sesión del sistema: título, libro, carátula y los saltos de 15 segundos. Con `shouldPlayInBackground` y `interruptionMode: doNotMix` el audio sigue con la pantalla bloqueada.

`react-native-track-player` también sirve para CarPlay y Android Auto, pero pide un cliente nativo aparte y entitlements de Apple. CarPlay no se puede probar ni publicar sin cuenta de desarrollador. Por eso no está cableado.

En la web, la misma ficha alimenta la Media Session API. El navegador decide qué controles muestra.
