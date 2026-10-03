import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2, Wallet, CalendarDays, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { fmtDate, gbp, outstandingTotal, sum } from "@/lib/calc";
import { useUI } from "@/lib/ui";
import { EmptyState, PageHeader, Panel, StatCard } from "@/components/erp/common";
import { Confirm, SearchBox, td, th, tr, usePaged } from "@/components/erp/table-tools";
import { pageHead } from "@/lib/meta";

export const Route = createFileRoute("/payments")({
  head: pageHead("Payments", "Money received from drivers, linked to bookings and invoices."),
  component: Payments,
});

function Payments() {
  const { payments, drivers, bookings, invoices, deletePayment } = useStore();
  const open = useUI((s) => s.open);
  const [q, setQ] = useState("");
  const mk = new Date().toISOString().slice(0, 7);
  const dn = (id: string) => drivers.find((d) => d.id === id)?.fullName ?? "—";
  const filtered = payments.filter((p) => `${dn(p.driverId)} ${p.reference} ${p.method} ${bookings.find((b) => b.id === p.bookingId)?.ref}`.toLowerCase().includes(q.toLowerCase()));
  const { slice, controls } = usePaged(filtered);

  return (
    <div className="space-y-6">
      <PageHeader title="Payments" description="Track money received from drivers." actions={<Button onClick={() => open("payment")}><Plus /> Record Payment</Button>} />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Payments" value={gbp(sum(payments.map((p) => p.amount)))} icon={Wallet} tone="success" hint={`${payments.length} recorded`} />
        <StatCard label="This Month" value={gbp(sum(payments.filter((p) => p.date.startsWith(mk)).map((p) => p.amount)))} icon={CalendarDays} />
        <StatCard label="Outstanding Amount" value={gbp(outstandingTotal(bookings, payments))} icon={AlertCircle} tone="destructive" />
      </div>
      <Panel>
        {payments.length === 0 ? <EmptyState icon={Wallet} title="No payments recorded yet" description="Record money received against a booking — invoice balances update automatically." action={<Button onClick={() => open("payment")}><Plus /> Record Payment</Button>} /> : (
          <>
            <div className="flex justify-end border-b p-4"><SearchBox value={q} onChange={setQ} placeholder="Search driver, reference…" /></div>
            <div className="overflow-x-auto"><table className="w-full">
              <thead><tr><th className={th}>Date</th><th className={th}>Driver</th><th className={th}>Booking</th><th className={th}>Invoice</th><th className={th}>Method</th><th className={th}>Reference</th><th className={th}>Amount</th><th className={th}></th></tr></thead>
              <tbody>{slice.map((p) => {
                const b = bookings.find((x) => x.id === p.bookingId); const inv = invoices.find((i) => i.id === p.invoiceId);
                return (
                  <tr key={p.id} className={tr}>
                    <td className={td}>{fmtDate(p.date)}</td><td className={td}>{dn(p.driverId)}</td>
                    <td className={td}>{b ? <Link to="/bookings/$id" params={{ id: b.id }} className="num text-primary hover:underline">{b.ref}</Link> : "—"}</td>
                    <td className={td}>{inv ? <Link to="/invoices/$id" params={{ id: inv.id }} className="num text-primary hover:underline">{inv.number}</Link> : <span className="text-muted-foreground">—</span>}</td>
                    <td className={td}>{p.method}</td><td className={td}>{p.reference || "—"}</td>
                    <td className={`${td} num font-medium text-success`}>{gbp(p.amount)}</td>
                    <td className={`${td} text-right`}><Confirm trigger={<Button variant="ghost" size="icon" aria-label="Delete"><Trash2 /></Button>} title="Delete payment?" description="The booking and invoice balance will be recalculated." onConfirm={() => { deletePayment(p.id); toast.success("Payment deleted"); }} /></td>
                  </tr>
                );
              })}</tbody>
            </table></div>
            {controls}
          </>
        )}
      </Panel>
    </div>
  );
}
