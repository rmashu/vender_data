"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Ledger } from "@/backend/ledger";

type Props = { rows: Ledger[]; onChange: (id: number, field: keyof Ledger, value: string) => void; onDelete: (id: number) => void };
const fields = ["store_name", "invoice_no", "invoice_date", "debit", "credit", "pending_balance"] as const;

export function LedgerTable({ rows, onChange, onDelete }: Props) {
  return <div className="overflow-x-auto rounded-xl border"><table className="w-full min-w-[900px] text-sm"><thead><tr className="border-b text-left">{["Store", "Invoice", "Date", "Debit", "Credit", "Pending", "Type", "Status", ""].map((head) => <th className="p-3" key={head}>{head}</th>)}</tr></thead><tbody>{rows.map((row) => <tr className="border-b" key={row.id}>{fields.map((field) => <td className="p-2" key={field}><Input type={field === "invoice_date" ? "date" : ["debit", "credit", "pending_balance"].includes(field) ? "number" : "text"} value={row[field]} onChange={(event) => onChange(row.id, field, event.target.value)} /></td>)}<td><select value={row.vch_type} onChange={(event) => onChange(row.id, "vch_type", event.target.value)}><option>Sales</option><option>Credit Note</option><option>Debit Note</option><option>Receipt</option><option>Payment</option><option>Journal</option></select></td><td><select value={row.status} onChange={(event) => onChange(row.id, "status", event.target.value)}><option>PENDING</option><option>PARTIAL</option><option>COMPLETED</option><option>DISPUTED</option></select></td><td><Button size="sm" variant="destructive" onClick={() => onDelete(row.id)}>Delete</Button></td></tr>)}</tbody></table></div>;
}
