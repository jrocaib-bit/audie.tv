# Texto de Torres Amat

Texto bíblico del reproductor. Traducción de Félix Torres Amat (1772-1847) desde la Vulgata, publicada entre 1823 y 1825 y revisada por el autor en 1832-1835. Dominio público: el autor murió en 1847 y las ediciones del siglo XIX tienen más de 140 años.

## De dónde sale cada fichero

- Texto: corpus alineado de Biblias en español de GIL-UNAM, versión PET (Torres Amat). Licencia CC0 1.0. Repositorio `GIL-UNAM/SpanishParaphraseCorpora`, carpeta `Biblias`, commit `3e4acb9`. Artículo: Sierra et al., «An aligned corpus of Spanish bibles», Language Resources and Evaluation, 2024, doi 10.1007/s10579-024-09726-y.
- Comprobación de procedencia: cotejo de n-gramas con el OCR de ediciones del siglo XIX en Internet Archive. El texto coincide entre un 47 % y un 77 % en cuatro palabras seguidas con la edición de 1823-1825 y con las de 1836 y 1883-1884, frente a un 1 % a 11 % de un texto moderno de control. Detalle en la ficha de la fuente (`09_app_web/trabajo/texto-reproductor-fuente-torres-amat.md`, fuera de este repositorio).
- Ediciones escaneadas en Internet Archive con la marca de dominio público (PD Mark 1.0): `A030134` a `A030142` (Madrid, Imprenta de Don León Amarita, 1823-1825, Biblioteca de la Universidad de Sevilla) y `AI156` a `AI159` (Barcelona, Montaner y Simón, 1883-1884).

## Qué lleva cada fichero

`es/<idEpisodio>.json` con los versículos del rango del episodio, `fuente: "torres-amat"` y `muestra: false`. Numeración de Torres Amat, que sigue la Vulgata. Los Salmos llevan la numeración hebrea de la CEE y del manifiesto, que es la de la fuente digital.

Los tiempos `t` salen de las transcripciones del audio y solo existen en los episodios con transcripción. Son estimados y por versículo.

`cobertura.json` lista el estado de los 516 episodios (`texto_resaltado`, `texto` o `sin_texto` con el motivo). No lleva texto.

## Libros que PET no trae y versículos omitidos

- Tobías, Judit, Ester, Sabiduría, Sirácide, 1 y 2 Macabeos y Baruc salen de la transcripción de Torres Amat de edicionescatolicas.org (ortografía actualizada, igual que PET). Cada versículo se acepta solo si coincide un 85 % o más con la lectura del OCR de la edición de París (Salvá, 1836, Internet Archive `lasagradabiblian06torr`, `08`, `10` y `12`) o si el cotejo de fragmentos con los facsímiles de 1836 y de 1883-1884 lo respalda. Los 4.648 versículos pasaron la comprobación.
- Los versículos «TEXTO OMITIDO» de PET (Levítico 2 a 7, Génesis 19 y 49, Oseas 5, Marcos 16, Apocalipsis 16), los Salmos 9, 119 y 120, Oseas 14 y Daniel 3, 13 y 14 se recuperan con el mismo método (cotejo con los facsímiles de Barcelona 1883-1884, `AI156` a `AI159`).
- Los episodios con `"mapeo": "capitulos"` muestran los capítulos completos sin resaltado, porque la numeración de versículos de la Vulgata difiere de la de referencia. La identidad de cada capítulo se comprueba con palabras distintivas.

## Qué queda sin texto

Un episodio sin mapeo seguro queda sin texto. Quedan así los episodios cuyo final no coincide con el del manifiesto por la numeración de la Vulgata (Eclesiastés 1 y 3, Ezequiel 19 a 20, Daniel 5 a 6, Miqueas 1, Malaquías 1), Joel 1 (capítulos ausentes en la fuente), Éxodo 40, 1 Reyes 9 y Cantar 1 (versículos omitidos cuya numeración no coincide con la Vulgata), los episodios de Tobías 9 a 11, Judit 7 a 16 y Ester 5 a 7, cuyo capítulo 5 no lleva la adición D. El motivo de cada uno consta en `cobertura.json`.

## Regenerar

El generador vive fuera del repositorio, en `09_app_web/trabajo/torres-amat-herramientas/generar_texto_torres_amat.py`.
