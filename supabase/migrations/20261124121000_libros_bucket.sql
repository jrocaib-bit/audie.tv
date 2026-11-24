-- Bucket privado de la sección de libros. Aplicado en el proyecto Audite el 24-nov-2026.
-- Sin políticas sobre storage.objects: solo la service role lee y escribe, desde el servidor.
-- El contenido (JSON de libros, lomos y cubiertas) no está en el repositorio.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('libros', 'libros', false, 10485760, array['application/json', 'image/webp', 'image/avif', 'image/png'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
