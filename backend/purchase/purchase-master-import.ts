import type { PurchaseMasterInput } from "@/backend/purchase/purchase-master-repository"

type ImportResult = {
  rows: PurchaseMasterInput[]
  skipped: number
}

const aliases: Record<string, keyof PurchaseMasterInput> = {
  financialyear: "fy",
  fy: "fy",
  gst: "gst_no",
  gstin: "gst_no",
  gstno: "gst_no",
  status: "status",
  store: "store_name",
  storename: "store_name",
  supplier: "supplier",
  suppliername: "supplier",
  vendor: "supplier",
  vendorname: "supplier",
  firstbilldate: "first_bill_date",
  firstbillingdate: "first_bill_date",
  billstartdate: "first_bill_date",
}

export function importPurchaseMasterCsv(content: string): ImportResult {
  const table = parseCsv(content)
  const [header, ...dataRows] = table

  if (!header) {
    return { rows: [], skipped: 0 }
  }

  const map = createMap(header)
  const rows: PurchaseMasterInput[] = []
  let skipped = 0

  dataRows.forEach((cells) => {
    const row = normalizeRow(cells, map)

    if (row) {
      rows.push(row)
    } else if (cells.some(Boolean)) {
      skipped += 1
    }
  })

  return { rows, skipped }
}

function normalizeRow(
  cells: string[],
  map: Partial<Record<keyof PurchaseMasterInput, number>>
): PurchaseMasterInput | null {
  const row: PurchaseMasterInput = {
    fy: getCell(cells, map.fy),
    gst_no: getCell(cells, map.gst_no).toUpperCase(),
    status:
      getCell(cells, map.status).toUpperCase() === "INACTIVE"
        ? "INACTIVE"
        : "ACTIVE",
    store_name: getCell(cells, map.store_name).toUpperCase(),
    supplier: getCell(cells, map.supplier),
    first_bill_date: getCell(cells, map.first_bill_date),
  }

  if (!row.fy || !row.store_name || !row.supplier || !row.gst_no) {
    return null
  }

  return row
}

function createMap(header: string[]) {
  const map: Partial<Record<keyof PurchaseMasterInput, number>> = {}

  header.forEach((cell, index) => {
    const key = aliases[normalizeHeader(cell)]

    if (key && map[key] === undefined) {
      map[key] = index
    }
  })

  return map
}

function parseCsv(content: string) {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ""
  let quoted = false

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index]
    const next = content[index + 1]

    if (char === '"' && quoted && next === '"') {
      cell += '"'
      index += 1
      continue
    }

    if (char === '"') {
      quoted = !quoted
      continue
    }

    if (char === "," && !quoted) {
      row.push(cleanCell(cell))
      cell = ""
      continue
    }

    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") {
        index += 1
      }

      row.push(cleanCell(cell))
      if (row.some(Boolean)) {
        rows.push(row)
      }
      row = []
      cell = ""
      continue
    }

    cell += char
  }

  row.push(cleanCell(cell))
  if (row.some(Boolean)) {
    rows.push(row)
  }

  return rows
}

function getCell(cells: string[], index?: number) {
  return index === undefined ? "" : cleanCell(cells[index] ?? "")
}

function cleanCell(value: string) {
  return value.trim().replace(/^"|"$/g, "")
}

function normalizeHeader(value: string) {
  return cleanCell(value)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
}
