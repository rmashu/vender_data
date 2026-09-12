import { inflateRawSync } from "node:zlib";
import { importLedgerTable } from "./ledger-import";

type ZipEntry = {
  name: string;
  data: Buffer;
};

export function importLedgerXlsx(buffer: ArrayBuffer) {
  const entries = readZipEntries(Buffer.from(buffer));
  const sharedStrings = readSharedStrings(entries.get("xl/sharedStrings.xml"));
  const sheetNames = [...entries.keys()].filter((name) => name.startsWith("xl/worksheets/sheet") && name.endsWith(".xml"));
  const table = sheetNames.flatMap((name) => readWorksheet(entries.get(name), sharedStrings));

  return importLedgerTable(table);
}

function readWorksheet(xml: Buffer | undefined, sharedStrings: string[]) {
  if (!xml) {
    return [];
  }

  const rows: string[][] = [];
  const text = xml.toString("utf8");
  const rowMatches = text.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g);

  for (const rowMatch of rowMatches) {
    const row: string[] = [];
    const cellMatches = rowMatch[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g);

    for (const cellMatch of cellMatches) {
      const attributes = cellMatch[1];
      const body = cellMatch[2];
      const ref = attributes.match(/\br="([A-Z]+)\d+"/)?.[1];
      const columnIndex = ref ? columnNameToIndex(ref) : row.length;

      while (row.length < columnIndex) {
        row.push("");
      }

      row[columnIndex] = readCellValue(attributes, body, sharedStrings);
    }

    if (row.some(Boolean)) {
      rows.push(row);
    }
  }

  return rows;
}

function readCellValue(attributes: string, body: string, sharedStrings: string[]) {
  const rawValue = body.match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? "";
  const type = attributes.match(/\bt="([^"]+)"/)?.[1];

  if (type === "s") {
    return sharedStrings[Number(rawValue)] ?? "";
  }

  if (type === "inlineStr") {
    return decodeXml([...body.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((match) => match[1]).join(""));
  }

  return decodeXml(rawValue);
}

function readSharedStrings(xml: Buffer | undefined) {
  if (!xml) {
    return [];
  }

  return [...xml.toString("utf8").matchAll(/<si>([\s\S]*?)<\/si>/g)].map((match) =>
    decodeXml([...match[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((textMatch) => textMatch[1]).join("")),
  );
}

function readZipEntries(buffer: Buffer) {
  const entries = new Map<string, Buffer>();
  let offset = buffer.length - 22;

  while (offset >= 0 && buffer.readUInt32LE(offset) !== 0x06054b50) {
    offset -= 1;
  }

  if (offset < 0) {
    throw new Error("Invalid XLSX file");
  }

  const directorySize = buffer.readUInt32LE(offset + 12);
  const directoryOffset = buffer.readUInt32LE(offset + 16);
  let cursor = directoryOffset;
  const end = directoryOffset + directorySize;

  while (cursor < end) {
    const header = readCentralDirectoryEntry(buffer, cursor);
    const entry = readLocalEntry(buffer, header);
    entries.set(entry.name, entry.data);
    cursor += 46 + header.nameLength + header.extraLength + header.commentLength;
  }

  return entries;
}

function readCentralDirectoryEntry(buffer: Buffer, offset: number) {
  if (buffer.readUInt32LE(offset) !== 0x02014b50) {
    throw new Error("Invalid XLSX directory");
  }

  const method = buffer.readUInt16LE(offset + 10);
  const compressedSize = buffer.readUInt32LE(offset + 20);
  const uncompressedSize = buffer.readUInt32LE(offset + 24);
  const nameLength = buffer.readUInt16LE(offset + 28);
  const extraLength = buffer.readUInt16LE(offset + 30);
  const commentLength = buffer.readUInt16LE(offset + 32);
  const localOffset = buffer.readUInt32LE(offset + 42);
  const name = buffer.toString("utf8", offset + 46, offset + 46 + nameLength);

  return { method, compressedSize, uncompressedSize, nameLength, extraLength, commentLength, localOffset, name };
}

function readLocalEntry(buffer: Buffer, entry: ReturnType<typeof readCentralDirectoryEntry>): ZipEntry {
  const nameLength = buffer.readUInt16LE(entry.localOffset + 26);
  const extraLength = buffer.readUInt16LE(entry.localOffset + 28);
  const dataStart = entry.localOffset + 30 + nameLength + extraLength;
  const compressed = buffer.subarray(dataStart, dataStart + entry.compressedSize);

  if (entry.method === 0) {
    return { name: entry.name, data: compressed };
  }

  if (entry.method === 8) {
    return { name: entry.name, data: inflateRawSync(compressed, { finishFlush: 2 }).subarray(0, entry.uncompressedSize) };
  }

  throw new Error("Unsupported XLSX compression");
}

function columnNameToIndex(name: string) {
  return name.split("").reduce((total, char) => total * 26 + char.charCodeAt(0) - 64, 0) - 1;
}

function decodeXml(value: string) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .trim();
}
