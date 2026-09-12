"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { LedgerForm } from "@/components/ledger/ledger-form";
import { LedgerSummary } from "@/components/ledger/ledger-summary";
import { LedgerTable } from "@/components/ledger/ledger-table";
import type { Ledger } from "@/backend/ledger";
import { stores, vendors } from "@/backend/masters/master-data";

const blankRow = (storeName: string): Ledger => ({
  id: Date.now(),
  store_name: storeName,
  invoice_no: "",
  invoice_date: new Date().toISOString().slice(0, 10),
  vch_type: "Sales",
  debit: 0,
  credit: 0,
  pending_balance: 0,
  status: "PENDING",
});

export function LedgerWorkspace() {
  const [vendor, setVendor] = useState<string>(vendors[0] ?? "");
  const [store, setStore] = useState<string>(stores[0] ?? "");
  const [from, setFrom] = useState("2025-04-01");
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState<Ledger[]>([blankRow(stores[0] ?? "")]);
  const [message, setMessage] = useState("");
  const [hasUploadedCsv, setHasUploadedCsv] = useState(false);

  const totals = useMemo(
    () =>
      rows.reduce(
        (total, row) => ({
          debit: total.debit + row.debit,
          credit: total.credit + row.credit,
          pending: total.pending + row.pending_balance,
        }),
        { debit: 0, credit: 0, pending: 0 },
      ),
    [rows],
  );

  const update = (id: number, field: keyof Ledger, value: string) =>
    setRows((current) =>
      current.map((row) =>
        row.id !== id
          ? row
          : {
              ...row,
              [field]: ["debit", "credit", "pending_balance"].includes(field) ? Number(value) || 0 : value,
            },
      ),
    );

  const save = async () => {
    if (!hasUploadedCsv) {
      setMessage("Please upload a CSV file before saving.");
      return;
    }

    const response = await fetch("/api/save-vendor-ledger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vendor_name: vendor,
        store_name: store,
        date_from: from,
        date_to: to,
        upload_timestamp: new Date().toISOString(),
        ledgers: rows.map((row) => ({ ...row, store_name: store })),
      }),
    });

    if (!response.ok) {
      setMessage("Unable to save ledger");
      return;
    }

    const result = (await response.json()) as { batchNumber?: string };
    setRows([blankRow(store)]);
    setHasUploadedCsv(false);
    setMessage(result.batchNumber ? `Your Batch number: ${result.batchNumber}` : "Saved successfully");
  };

  const clearForm = () => {
    setRows([blankRow(store)]);
    setHasUploadedCsv(false);
    setMessage("");
  };

  const upload = async (file: File | null) => {
    if (!file) return;

    try {
      const formData = new FormData();
      formData.set("file", file);
      const response = await fetch("/api/import-ledger", { method: "POST", body: formData });
      const result = (await response.json()) as { rows?: Ledger[]; skipped?: number };

      if (!response.ok || !result.rows?.length) {
        setMessage("No valid ledger rows found in file");
        return;
      }

      setRows(result.rows.map((row) => ({ ...row, store_name: store })));
      setHasUploadedCsv(true);
      setMessage("");
    } catch {
      setMessage("Unable to read this file. Use CSV format.");
    }
  };

  return (
    <>
      <LedgerForm
        stores={stores}
        vendors={vendors}
        store={store}
        vendor={vendor}
        from={from}
        to={to}
        onStoreChange={setStore}
        onVendorChange={setVendor}
        onFromChange={setFrom}
        onToChange={setTo}
        onFileChange={(event) => upload(event.target.files?.[0] ?? null)}
      />
      <LedgerSummary debit={totals.debit} credit={totals.credit} pending={totals.pending} />
      <LedgerTable rows={rows} onChange={update} onDelete={(id) => setRows(rows.filter((item) => item.id !== id))} />
      <footer className="flex justify-between">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setRows([...rows, blankRow(store)])}>
            Add row
          </Button>
        </div>
        <Button disabled={!hasUploadedCsv} onClick={save}>Save to database</Button>
      </footer>
      {message && (
        <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
          <p>{message}</p>
        </div>
      )}
    </>
  );
}
