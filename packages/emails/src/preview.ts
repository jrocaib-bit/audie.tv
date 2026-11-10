import { mkdirSync, writeFileSync } from "node:fs";
import { componer } from "./componer";
import { IDS_CORREO, type DatosCorreo } from "./textos";

const muestra: DatosCorreo = {
  nombre: "Ada",
  plan: "anual",
  fecha_fin_prueba: "17 de noviembre de 2026",
  fecha_proximo_cobro: "17 de noviembre de 2026",
  plataforma: "App Store",
  nombre_reto: "Adviento con Isaías",
  reto_id: "adviento-isaias",
  fecha_fin_acceso: "17 de noviembre de 2026",
  token: "00000000-0000-4000-8000-000000000001",
};

const directorio = process.argv[2] || "/opt/cursor/artifacts/correos";
mkdirSync(directorio, { recursive: true });

const piezas: string[] = [];
for (const id of IDS_CORREO) {
  const correo = await componer(id, muestra);
  writeFileSync(`${directorio}/${id}.txt`, correo.texto);
  writeFileSync(`${directorio}/${id}.html`, correo.html);
  piezas.push(`<section style="margin:24px 0;padding:16px;border:1px solid #2E2924"><h2 style="font-family:Georgia,serif">${id}</h2><p>A. ${correo.asuntoA}</p><p>B. ${correo.asuntoB}</p><p>${correo.preheader}</p><iframe src="${id}.html" style="width:100%;height:420px;border:0;background:#100E0C"></iframe></section>`);
}

writeFileSync(`${directorio}/index.html`, `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Correos</title></head><body style="background:#100E0C;color:#F4ECE2;font-family:Georgia,serif;max-width:880px;margin:0 auto">${piezas.join("")}</body></html>`);
console.log(directorio);
