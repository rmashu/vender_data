"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Ledger } from "@/backend/ledger";

type Props = { rows: Ledger[]; onChange: (id: number, field: keyof Ledger, value: string) => void; onDelete: (id: number) => void };
const fields = ["store_name", "invoice_no", "invoice_date", "debit", "credit", "pending_balance"] as const;
const voucherTypes = ["Sales", "Credit Note", "Debit Note", "Receipt", "Payment", "Journal"];
const statuses = ["PENDING", "PARTIAL", "COMPLETED", "DISPUTED"];

export function LedgerTable({ rows, onChange, onDelete }: Props) {
  return <div className="overflow-x-auto rounded-xl border"><table className="w-full min-w-[900px] text-sm"><thead><tr className="border-b text-left">{["Store", "Invoice", "Date", "Debit", "Credit", "Pending", "Type", "Status", ""].map((head) => <th className="p-3" key={head}>{head}</th>)}</tr></thead><tbody>{rows.map((row) => <tr className="border-b" key={row.id}>{fields.map((field) => <td className="p-2" key={field}><Input type={field === "invoice_date" ? "date" : ["debit", "credit", "pending_balance"].includes(field) ? "number" : "text"} value={row[field]} onChange={(event) => onChange(row.id, field, event.target.value)} /></td>)}<td><Select value={row.vch_type} onValueChange={(value) => onChange(row.id, "vch_type", value as string)}><SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger><SelectContent>{voucherTypes.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select></td><td><Select value={row.status} onValueChange={(value) => onChange(row.id, "status", value as string)}><SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger><SelectContent>{statuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select></td><td><Button size="sm" variant="destructive" onClick={() => onDelete(row.id)}>Delete</Button></td></tr>)}</tbody></table></div>;
}
