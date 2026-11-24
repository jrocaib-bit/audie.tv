/** Clave de localStorage con el progreso y las notas de un libro. La comparten el lector y la estantería. */
export const claveLibro = (id: string) => `audite.libros.v1.${id}`;
