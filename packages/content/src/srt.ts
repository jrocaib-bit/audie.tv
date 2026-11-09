export type SrtCue = { startSeconds: number; endSeconds: number; text: string };

export function parseTimestamp(value: string): number {
  const match = value.trim().match(/^(\d+):(\d+):(\d+)[,.](\d+)$/);
  if (!match) throw new Error(`Bad timestamp: ${value}`);
  const millis = match[4].padEnd(3, "0").slice(0, 3);
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]) + Number(millis) / 1000;
}

export function parseSrt(source: string): SrtCue[] {
  const blocks = source.replace(/\r\n/g, "\n").trim().split(/\n\n+/);
  return blocks.map((block) => {
    const lines = block.split("\n").filter((line) => line.trim().length > 0);
    const timeIndex = lines.findIndex((line) => line.includes("-->"));
    if (timeIndex < 0) throw new Error("SRT block is missing a time line.");
    const [startRaw, endRaw] = lines[timeIndex].split("-->");
    const text = lines
      .slice(timeIndex + 1)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (!text) throw new Error("SRT block is missing text.");
    return {
      startSeconds: parseTimestamp(startRaw ?? ""),
      endSeconds: parseTimestamp(endRaw ?? ""),
      text,
    };
  });
}

export type CueRow = {
  startSeconds: number;
  endSeconds: number;
  assetId: string;
  sectionLabel: string;
  editorialNote: string;
};

export function parseCueCsv(source: string): CueRow[] {
  const lines = source.replace(/\r\n/g, "\n").trim().split("\n").slice(1);
  return lines.filter((line) => line.trim().length > 0).map(parseCueLine);
}

function parseCueLine(line: string): CueRow {
  const match = line.match(/^[^,]*,[^,]*,([^,]*),([^,]*),([^,]*),(.*)$/);
  if (!match) throw new Error(`Bad cue row: ${line}`);
  const rest = match[4] ?? "";
  let sectionLabel = "";
  let editorialNote = "";
  if (rest.startsWith('"')) {
    let index = 1;
    let label = "";
    while (index < rest.length) {
      if (rest[index] === '"') {
        index += 1;
        break;
      }
      label += rest[index];
      index += 1;
    }
    sectionLabel = label;
    editorialNote = rest.slice(index).replace(/^,/, "");
  } else {
    const comma = rest.indexOf(",");
    sectionLabel = comma === -1 ? rest : rest.slice(0, comma);
    editorialNote = comma === -1 ? "" : rest.slice(comma + 1);
  }
  editorialNote = editorialNote.trim();
  if (editorialNote.startsWith('"') && editorialNote.endsWith('"')) {
    editorialNote = editorialNote.slice(1, -1);
  }
  if (!sectionLabel || !editorialNote) throw new Error(`Cue row is missing a label or note: ${line}`);
  return {
    startSeconds: Number(match[1]),
    endSeconds: Number(match[2]),
    assetId: match[3] ?? "",
    sectionLabel,
    editorialNote,
  };
}
