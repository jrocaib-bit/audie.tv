import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { construirCatalogo } from "@audite/content/app-catalog";
import { validarManifiesto } from "@audite/content/manifiesto";
import type { Manifiesto } from "@audite/domain";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const canon = path.join(repo, "content/demo");
const pilot = path.join(repo, "content/pilot");

function arte(
  archivo: string,
  tituloEs: string,
  tituloEn: string,
  autor: string,
  anio: string,
  ubicacion: string,
  derechos: string,
  fuente: string,
  ancho: number,
  alto: number,
  inicio: number,
  fin: number,
  nota: string,
) {
  return {
    archivo,
    titulo: { es: tituloEs, en: tituloEn },
    autor,
    anio,
    ubicacion,
    derechos,
    fuente,
    ancho,
    alto,
    inicio_s: inicio,
    fin_s: fin,
    nota,
  };
}

const obras = {
  adan: {
    archivo: "04_arte/gn-01/A03_adan.jpg",
    es: "La creación de Adán",
    en: "The Creation of Adam",
    autor: "Miguel Ángel",
    anio: "1511",
    ubicacion: "Capilla Sixtina, Museos Vaticanos, Ciudad del Vaticano",
    derechos: "Miguel Ángel, La creación de Adán, 1511. Capilla Sixtina. Reproducción vía Wikimedia Commons, PD-Art.",
    fuente: "https://commons.wikimedia.org/wiki/File:Creaci%C3%B3n_de_Ad%C3%A1n.jpg",
    ancho: 4256,
    alto: 2843,
  },
  geometra: {
    archivo: "04_arte/gn-01/A05_geometra.jpg",
    es: "Dios arquitecto del universo — Bible moralisée",
    en: "God as Architect of the Universe — Bible moralisée",
    autor: "Anónimo",
    anio: "c. 1220–1230",
    ubicacion: "Biblioteca Nacional de Austria, Viena; Cod. 2554, fol. 1v",
    derechos: "Anónimo, Dios arquitecto del universo, c. 1220–1230. ÖNB, Viena. Reproducción vía Wikimedia Commons, PD-Art.",
    fuente: "https://commons.wikimedia.org/wiki/File:God_the_Geometer.jpg",
    ancho: 1244,
    alto: 1705,
  },
  tabla: {
    archivo: "04_arte/gn-01/A06_eden_tabla_izquierda.jpg",
    es: "Tríptico del Jardín de las delicias — tabla izquierda (detalle)",
    en: "The Garden of Earthly Delights Triptych — left panel (detail)",
    autor: "El Bosco",
    anio: "1490–1500",
    ubicacion: "Museo Nacional del Prado, Madrid; P002823",
    derechos:
      "El Bosco, Jardín de las delicias, 1490–1500, tabla izquierda (detalle). Museo del Prado. Reproducción Google Earth/Prado, ensamblaje AxelBoldt; versión retocada de Commons. Recorte Audite.",
    fuente: "https://commons.wikimedia.org/wiki/File:The_Garden_of_Earthly_Delights_by_Bosch_High_Resolution_2.jpg",
    ancho: 1452,
    alto: 3500,
  },
  detalle: {
    archivo: "04_arte/gn-01/A06_eden_presentacion_detalle.jpg",
    es: "Tríptico del Jardín de las delicias — tabla izquierda (detalle)",
    en: "The Garden of Earthly Delights Triptych — left panel (detail)",
    autor: "El Bosco",
    anio: "1490–1500",
    ubicacion: "Museo Nacional del Prado, Madrid; P002823",
    derechos:
      "El Bosco, Jardín de las delicias, 1490–1500, tabla izquierda (detalle). Museo del Prado. Reproducción Google Earth/Prado, ensamblaje AxelBoldt; versión retocada de Commons. Recorte Audite.",
    fuente: "https://commons.wikimedia.org/wiki/File:The_Garden_of_Earthly_Delights_by_Bosch_High_Resolution_2.jpg",
    ancho: 3000,
    alto: 2905,
  },
  animales: {
    archivo: "04_arte/gn-01/A11_animales_CC0.jpg",
    es: "La creación de los animales",
    en: "The Creation of the Animals",
    autor: "Jacopo Tintoretto",
    anio: "1550–1553",
    ubicacion: "Gallerie dell’Accademia, Venecia; inv. 900",
    derechos:
      "Jacopo Tintoretto, La creación de los animales, 1550–1553. Gallerie dell’Accademia. Foto: Gleb Simonov, 2019, CC0 1.0, vía Wikimedia Commons.",
    fuente: "https://commons.wikimedia.org/wiki/File:Jacopo_Tintoretto_%E2%80%94_Creation_of_the_Animals.jpg",
    ancho: 4299,
    alto: 2484,
  },
};

const cortes: Array<[keyof typeof obras, number, number, string]> = [
  ["geometra", 0, 151.52, "Imagen simbólica de creación. Mantener vista completa; no fingir que representa literalmente cada día."],
  ["animales", 151.52, 208.08, "Plano completo; detalle moderado sin perder contexto."],
  ["adan", 208.08, 281.64, "Escena de Adán como representación artística de humanidad; no ilustración literal de cada frase."],
  ["geometra", 281.64, 308.6, "Regreso al motivo de apertura."],
  ["adan", 308.6, 345.36, "No pretende representar literalmente el modelado del polvo."],
  ["tabla", 345.36, 418.796688, "Unión de piezas dentro de este plano en 06:07.517. El cuadro no es mapa de los cuatro ríos."],
  ["animales", 418.796688, 452.476688, "Volver a la obra de Tintoretto."],
  ["detalle", 452.476688, 473.296688, "PROPUESTA: presentación de Eva, no extracción de costilla. Si se exige literalidad, esta fila necesita otra imagen."],
  ["detalle", 473.296688, 498.050563, "Presentación como asociación artística; conservar el rótulo de detalle."],
];

mkdirSync(path.join(canon, "05_audio/masters"), { recursive: true });
mkdirSync(path.join(canon, "04_arte/gn-01"), { recursive: true });
mkdirSync(path.join(canon, "02_guiones"), { recursive: true });
mkdirSync(path.join(canon, "01_canon"), { recursive: true });
mkdirSync(path.join(canon, "03_identidad"), { recursive: true });

const lista = path.join(canon, "05_audio/masters/concat.txt");
writeFileSync(
  lista,
  `file '${path.join(pilot, "audio/ES_p1_original.mp3")}'\nfile '${path.join(pilot, "audio/ES_p2_original.mp3")}'\n`,
);
const master = path.join(canon, "05_audio/masters/gn-01_es_master_v1.mp3");
const ffmpeg = spawnSync("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", lista, "-c", "copy", master], { encoding: "utf8" });
rmSync(lista, { force: true });
if (ffmpeg.status !== 0) {
  console.error(ffmpeg.stderr);
  process.exit(1);
}
const probe = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", master], { encoding: "utf8" });
const duracion = Number(probe.stdout.trim());
if (!Number.isFinite(duracion)) process.exit(1);

for (const obra of Object.values(obras)) {
  copyFileSync(path.join(pilot, "assets", path.basename(obra.archivo)), path.join(canon, obra.archivo));
}

const srt = readFileSync(path.join(pilot, "documentos/transcripcion_automatica_ES.srt"), "utf8");
const vtt = `WEBVTT\n\n${srt
  .replace(/\r\n/g, "\n")
  .trim()
  .split(/\n\n+/)
  .map((block) => {
    const lines = block.split("\n");
    const timeIndex = lines.findIndex((line) => line.includes("-->"));
    const tiempo = (lines[timeIndex] ?? "").replaceAll(",", ".");
    let texto = lines.slice(timeIndex + 1).join("\n");
    if (tiempo.startsWith("00:01:52")) texto = texto.replace("las días", "las fiestas, los días");
    return `${tiempo}\n${texto}`;
  })
  .join("\n\n")}\n`;
writeFileSync(path.join(canon, "02_guiones/gn-01_es_guion_v1.vtt"), vtt);

const manifiesto: Manifiesto = {
  version: 1,
  actualizado: "2026-11-09T10:00:00+01:00",
  idiomas: ["es", "en"],
  libros: [
    {
      id: "gn",
      orden: 1,
      testamento: "AT",
      titulo: { es: "Génesis", en: "Genesis" },
      episodios: [
        {
          id: "gn-01",
          orden: 1,
          capitulos: "1–2",
          titulo: { es: "En el principio. La creación y el hombre." },
          resumen: { es: "Génesis 1–2 en una sola narración española." },
          arte: cortes.map(([clave, inicio, fin, nota]) => {
            const obra = obras[clave];
            return arte(obra.archivo, obra.es, obra.en, obra.autor, obra.anio, obra.ubicacion, obra.derechos, obra.fuente, obra.ancho, obra.alto, inicio, fin, nota);
          }),
          idiomas: {
            es: {
              estado: "audio_listo",
              master: "05_audio/masters/gn-01_es_master_v1.mp3",
              duracion_s: duracion,
              subtitulos: "02_guiones/gn-01_es_guion_v1.vtt",
            },
            en: { estado: "pendiente" },
          },
        },
      ],
    },
  ],
};

const validado = validarManifiesto(manifiesto);
if (!validado.ok) {
  console.error(validado.errores);
  process.exit(1);
}
writeFileSync(path.join(canon, "01_canon/manifiesto.json"), `${JSON.stringify(manifiesto, null, 2)}\n`);
writeFileSync(path.join(canon, "03_identidad/disponibles.json"), `${JSON.stringify({ wordmark: null, mark: null }, null, 2)}\n`);
const catalogo = construirCatalogo(manifiesto, canon, "/demo");
writeFileSync(path.join(canon, "catalogo-app.json"), `${JSON.stringify(catalogo, null, 2)}\n`);
console.log(`demo · master ${duracion}s · episodios ${catalogo.episodes.length} reproducibles, ${catalogo.pendientes.length} pendientes`);
