type LedgerSummaryProps = { debit: number; credit: number; pending: number };

export function LedgerSummary({ debit, credit, pending }: LedgerSummaryProps) {
  return <section className="grid gap-3 md:grid-cols-3">


    {[['Debit', debit], ['Credit', credit], ['Closing Balance', pending]].map(([label, value]) => (
      <div className="rounded-xl border p-4" key={String(label)}><small>{label}</small><div className="text-xl font-bold">₹{Number(value).toFixed(2)}</div></div>
    ))}
  </section>;
}

type SummaryRow = {
  account: string;
  opening: number;
  debit: number;
  credit: number;
  closing: number;
};

type Props = {
  rows: SummaryRow[];
  totals: {
    opening: number;
    debit: number;
    credit: number;
    closing: number;
  };
};

const formatMoney = (value: number) =>
  Math.abs(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatBalance = (value: number) => {
  if (value === 0) return "0.00";
  return `${formatMoney(value)} Dr`;
};

export function LedgerAccountSummary({ rows, totals }: Props) {
  return (
    <section className="overflow-x-auto rounded-xl border">
      <table className="w-full min-w-[700px] text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="p-3">Account</th>
            <th className="p-3">Opening</th>
            <th className="p-3">Total Debit</th>
            <th className="p-3">Total Credit</th>
            <th className="p-3">Closing Balance</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr className="border-b" key={row.account}>
              <td className="p-3 font-medium">{row.account}</td>
              <td className="p-3">{formatBalance(row.opening)}</td>
              <td className="p-3">{formatMoney(row.debit)}</td>
              <td className="p-3">{formatMoney(row.credit)}</td>
              <td className="p-3 font-medium">{formatBalance(row.closing)}</td>
            </tr>
          ))}

          <tr className="bg-muted/40 font-semibold">
            <td className="p-3">TOTAL</td>
            <td className="p-3">{formatBalance(totals.opening)}</td>
            <td className="p-3">{formatMoney(totals.debit)}</td>
            <td className="p-3">{formatMoney(totals.credit)}</td>
            <td className="p-3">{formatBalance(totals.closing)}</td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}