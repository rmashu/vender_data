"use client";

import type { ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload } from "lucide-react";

type LedgerFormProps = {
  stores: readonly string[]; vendors: readonly string[]; store: string; vendor: string; from: string; to: string;
  onStoreChange: (value: string) => void; onVendorChange: (value: string) => void; onFromChange: (value: string) => void;
  onToChange: (value: string) => void; onFileChange?: (event: ChangeEvent<HTMLInputElement>) => void;
};

export function LedgerForm({ stores, vendors, store, vendor, from, to, onStoreChange, onVendorChange, onFromChange, onToChange, onFileChange }: LedgerFormProps) {
  const uniqueStores = [...new Set(stores)];
  const uniqueVendors = [...new Set(vendors)];

  return <section className="grid gap-3 rounded-xl border p-4 md:grid-cols-5">
    <div className="space-y-1">
      <p className="text-sm font-medium">Store Name</p>
      <Select value={store} onValueChange={(value) => onStoreChange(value as string)}>
        <SelectTrigger><SelectValue placeholder="Select Store" /></SelectTrigger>
        <SelectContent>{uniqueStores.map((name) => <SelectItem key={name} value={name}>{name}</SelectItem>)}</SelectContent>
      </Select>
    </div>
    <div className="space-y-1">
      <p className="text-sm font-medium">Vendor Name</p>
      <Select value={vendor} onValueChange={(value) => onVendorChange(value as string)}>
        <SelectTrigger><SelectValue placeholder="Select Vendor" /></SelectTrigger>
        <SelectContent>{uniqueVendors.map((name) => <SelectItem key={name} value={name}>{name}</SelectItem>)}</SelectContent>
      </Select>
    </div>
    <div className="space-y-1">
      <p className="text-sm font-medium">From Date</p>
      <Input type="date" value={from} onChange={(event) => onFromChange(event.target.value)} />
    </div>
    <div className="space-y-1">
      <p className="text-sm font-medium">To Date</p>
      <Input type="date" value={to} onChange={(event) => onToChange(event.target.value)} />
    </div>
    <div className="space-y-1">
      <p className="text-sm font-medium">CSV File</p>
    <label className="flex h-8 cursor-pointer items-center justify-start gap-2 rounded-lg border border-input bg-transparent px-3 text-sm hover:bg-muted">
        <Upload className="size-4" aria-hidden="true" />
        <span>Choose CSV</span>
        <Input className="hidden" type="file" accept=".csv,text/csv" onChange={onFileChange} />
      </label>
    </div>
  </section>;
}

