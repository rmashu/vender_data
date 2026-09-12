type LedgerSummaryProps = { debit: number; credit: number; pending: number };

export function LedgerSummary({ debit, credit, pending }: LedgerSummaryProps) {
  return <section className="grid gap-3 md:grid-cols-3">
    {[['Debit', debit], ['Credit', credit], ['Pending', pending]].map(([label, value]) => (
      <div className="rounded-xl border p-4" key={String(label)}><small>{label}</small><div className="text-xl font-bold">₹{Number(value).toFixed(2)}</div></div>
    ))}
  </section>;
}
