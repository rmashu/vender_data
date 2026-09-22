import type { Ledger } from "./ledger";


type ImportResult = {
  rows: Ledger[];
  skipped: number;
};

type ColumnMap = Partial<Record<keyof Ledger, number>>;

const headerAliases: Record<string, keyof Ledger> = {
invoice: "invoice_no",
invoiceno: "invoice_no",
invoicenumber: "invoice_no",
billno: "invoice_no",
billnumber: "invoice_no",
voucherno: "invoice_no",
vouchernumber: "invoice_no",
documentno: "invoice_no",
documentnumber: "invoice_no",
referenceno: "invoice_no",
refno: "invoice_no",
transactionid: "invoice_no",
entryno: "invoice_no",
serialno: "invoice_no",
vchbillno: "invoice_no",

date: "invoice_date",
invoicedate: "invoice_date",
billdate: "invoice_date",
voucherdate: "invoice_date",
documentdate: "invoice_date",
transactiondate: "invoice_date",
postingdate: "invoice_date",
entrydate: "invoice_date",

opening: "opening_balance",
openingbalance: "opening_balance",
openingamount: "opening_balance",
openingbalancers: "opening_balance",

debit: "debit",
dr: "debit",
debitamount: "debit",
dramount: "debit",
debitvalue: "debit",
debitrs: "debit",

credit: "credit",
creditrs: "credit",
cr: "credit",
creditamount: "credit",
cramount: "credit",
creditvalue: "credit",

balance: "pending_balance",
balancers: "pending_balance",
closingbalance: "pending_balance",
runningbalance: "pending_balance",
balanceamount: "pending_balance",
outstanding: "pending_balance",
outstandingbalance: "pending_balance",

type: "vch_type",
transactiontype: "vch_type",
entrytype: "vch_type",
vouchertype: "vch_type",
documenttype: "vch_type",
transaction: "vch_type",
vchtype: "vch_type",

amount: "pending_balance",
dueamount: "pending_balance",
invamount: "debit",
pending: "pending_balance",
pendingbalance: "pending_balance",
store: "store_name",
storename: "store_name",
vchno: "invoice_no",
invoiceno2: "invoice_no",
account: "store_name",
shortnarration: "store_name",
};

export function importLedgerFile(fileName: string, content: string): ImportResult {
  if (fileName.toLowerCase().endsWith(".json")) {
    return importJson(content);
  }

  return importCsv(content);
}

function importJson(content: string): ImportResult {
  const parsed: unknown = JSON.parse(content);
  const rawRows = Array.isArray(parsed)
    ? parsed
    : isRecord(parsed) && Array.isArray(parsed.ledgers)
      ? parsed.ledgers
      : [];

  return normalizeUnknownRows(rawRows);
}

function importCsv(content: string): ImportResult {
  return importLedgerTable(parseCsv(content));
}

export function importLedgerTable(table: string[][]): ImportResult {
  const rows: Ledger[] = [];
  let skipped = 0;
  let activeMaps: ColumnMap[] = [];

  for (const cells of table) {
    const maps = findHeaderMaps(cells);

    if (maps.length > 0) {
      activeMaps = maps;
      continue;
    }

    if (activeMaps.length === 0) {
      continue;
    }

    for (const map of activeMaps) {
      const row = normalizeCsvRow(cells, map);

      if (row) {
        rows.push(row);
      } else if (hasValuesForMap(cells, map)) {
        skipped += 1;
      }
    }
  }

  return { rows, skipped };
}

function normalizeUnknownRows(values: unknown[]): ImportResult {
  const rows: Ledger[] = [];
  let skipped = 0;

  values.forEach((value) => {
    if (!isRecord(value)) {
      skipped += 1;
      return;
    }

    const row = normalizeRecord(value);

    if (row) {
      rows.push(row);
    } else {
      skipped += 1;
    }
  });

  return { rows, skipped };
}

function normalizeRecord(record: Record<string, unknown>): Ledger | null {
  const row: Ledger = {
    id: createId(),
    store_name: toText(record.store_name ?? record.store ?? record.particulars),
    invoice_no: toText(record.invoice_no ?? record.invoice ?? record.vch_no ?? record.voucher_no),
    invoice_date: normalizeDate(toText(record.invoice_date ?? record.bill_date ?? record.date)),
    vch_type: toText(record.vch_type ?? record.type) || "Sales",
    opening_balance: toNumber(record.opening_balance ?? record.opening ?? record.opening_balance_amount),
    debit: toNumber(record.debit ?? record.inv_amount ?? record.amount),
    credit: toNumber(record.credit),
    pending_balance: toNumber(record.pending_balance ?? record.balance ?? record.pending),
    status: toText(record.status).toUpperCase() || "PENDING",
  };

  return hasMinimumLedgerData(row) ? row : null;
}

function normalizeCsvRow(cells: string[], map: ColumnMap): Ledger | null {
  const row: Ledger = {
    id: createId(),
    store_name: getCell(cells, map.store_name),
    invoice_no: getCell(cells, map.invoice_no),
    invoice_date: normalizeDate(getCell(cells, map.invoice_date)),
    vch_type: getCell(cells, map.vch_type) || "Sales",
    opening_balance: toNumber(getCell(cells, map.opening_balance)),
    debit: toNumber(getCell(cells, map.debit)),
    credit: toNumber(getCell(cells, map.credit)),
    pending_balance: toNumber(getCell(cells, map.pending_balance)),
    status: getCell(cells, map.status).toUpperCase() || "PENDING",
  };

  if (!row.pending_balance && row.debit > row.credit) {
    row.pending_balance = row.debit - row.credit;
  }

  if (!row.invoice_no) {
    row.invoice_no = row.store_name;
  }

  return hasMinimumLedgerData(row) ? row : null;
}

function findHeaderMaps(cells: string[]): ColumnMap[] {
  const starts = cells
    .map((cell, index) => ({ key: normalizeHeader(cell), index }))
    .filter(({ key }) => key === "date" || key === "invoiceno");

  return starts
    .map(({ index }, startIndex) => {
      const end = starts[startIndex + 1]?.index ?? cells.length;
      return createColumnMap(cells, index, end);
    })
    .filter((map) => map.invoice_date !== undefined && (map.debit !== undefined || map.credit !== undefined));
}

function createColumnMap(cells: string[], start: number, end: number): ColumnMap {
  const map: ColumnMap = {};

  for (let index = start; index < end; index += 1) {
    const key = headerAliases[normalizeHeader(cells[index])];

    if (key && map[key] === undefined) {
      map[key] = index;
    }
  }

  return map;
}

function parseCsv(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    const next = content[index + 1];

    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if (char === "," && !quoted) {
      row.push(cleanCell(cell));
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }

      row.push(cleanCell(cell));
      if (row.some(Boolean)) {
        rows.push(row);
      }
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  row.push(cleanCell(cell));
  if (row.some(Boolean)) {
    rows.push(row);
  }

  return rows;
}

function hasMinimumLedgerData(row: Ledger) {
  return Boolean(row.invoice_date && row.invoice_no && (row.debit || row.credit || row.pending_balance));
}

function hasValuesForMap(cells: string[], map: ColumnMap) {
  return Object.values(map).some((index) => getCell(cells, index).length > 0);
}

function getCell(cells: string[], index: number | undefined) {
  if (index === undefined) {
    return "";
  }

  return cleanCell(cells[index] ?? "");
}

function normalizeHeader(value: string) {
  return cleanCell(value)
    .toLowerCase()
    .replace(/no\./g, "no")
    .replace(/[^a-z0-9]/g, "");
}

function normalizeDate(value: string) {
  const text = cleanCell(value);

  if (!text) {
    return "";
  }

  const excelNumber = Number(text);
  if (Number.isFinite(excelNumber) && excelNumber > 20000 && excelNumber < 80000) {
    return new Date(Date.UTC(1899, 11, 30 + excelNumber)).toISOString().slice(0, 10);
  }

  const slashDate = text.match(/^(\d{1,2})[/-]([A-Za-z]{3}|\d{1,2})[/-](\d{2,4})$/);
  if (!slashDate) {
    return text;
  }

  const [, day, rawMonth, rawYear] = slashDate;
  const year = Number(rawYear.length === 2 ? `20${rawYear}` : rawYear);
  const month = monthToNumber(rawMonth);

  if (!month) {
    return text;
  }

  return `${year}-${String(month).padStart(2, "0")}-${String(Number(day)).padStart(2, "0")}`;
}

function monthToNumber(value: string) {
  const monthNumber = Number(value);

  if (Number.isFinite(monthNumber)) {
    return monthNumber;
  }

  return ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"].indexOf(value.slice(0, 3).toLowerCase()) + 1;
}

function toNumber(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const parsed = Number(toText(value).replace(/,/g, "").replace(/dr|cr/gi, "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function toText(value: unknown) {
  return typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
}

function cleanCell(value: string) {
  return value.trim().replace(/^"|"$/g, "").trim();
}

function createId() {
  return Date.now() + Math.floor(Math.random() * 1_000_000);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
