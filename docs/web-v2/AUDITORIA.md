# Auditoría de la web pública

Revisión del sitio en producción (commit `67c1433`) en español e inglés, a 390 px y 1440 px. Lo que sigue es lo que se vio en las capturas y en el código de las rutas públicas. Cada punto queda corregido en esta rama.

## Fallos

- Fila «Caminos» en el inicio: los títulos van en una sola línea y se pisan («El jardín del Edén…» entra en «Los tres visitantes en Mambré»).
- Esa misma fila, y la de libros, pone un candado en cada tarjeta. En una web que solo escucha, el candado no explica nada.
- `/es/catalogo/gn-01`: una caja grande de crédito de museo tapa el episodio, y debajo aparece el crédito de la Conferencia Episcopal.
- El catálogo público lista obras sueltas, no los libros con sus episodios.
- La ficha de libro (`/es/libro/gn`) enseña solo ocho episodios y el título no puede partirse.
- El inicio es una sucesión de pantallas completas, con precios, preguntas y filas, sin decir en una frase qué es Audite ni por dónde empezar.
- La navegación mezcla membresía, escucha y catálogo. No hay una entrada clara a Retos ni a la App.
- Los retos del año no se presentan juntos. Falta el reto principal: escuchar la Biblia de principio a fin. Adviento no queda el primero cuando es el tiempo que toca.
- `/es/adviento` y `/en/advent` existen, pero el título usa una sola línea que puede salirse, y no explican el reto.
- En retos y en la ficha de libro del reproductor, lo que aún no se puede oír se marca con un candado en vez de «Pronto».
- Varias pantallas dicen «Pronto» para cosas distintas (obra, episodio, traducción) sin decir si está disponible o si llega después.

## Qué se hizo

- El inicio explica Audite en dos frases y lleva al catálogo o a los retos. La navegación es Inicio, Catálogo, Retos y App. Ayuda, Contacto y Créditos quedan en el pie.
- El catálogo agrupa Antiguo y Nuevo Testamento. Cada libro muestra su imagen y cuántos episodios tiene, y abre la lista completa, sin candados.
- El episodio muestra la obra, el título, la referencia y un resumen corto. El crédito del museo es un desplegable «Sobre la obra». El texto bíblico se acredita solo en Créditos.
- Retos abre con «Escucha la Biblia de principio a fin», luego los retos del año con Adviento primero en esta fecha, y tres pasos de «¿Cómo funciona?». `/es/adviento` y `/en/advent` siguen en su sitio.
