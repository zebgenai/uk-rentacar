import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { FileText, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useStore, type InvoiceStatus } from "@/lib/store";
import { fmtDate, gbp, invoiceStatus, paidForBooking } from "@/lib/calc";
import { EmptyState, PageHeader, Panel, StatusBadge } from "@/components/erp/common";
import { FilterPills, SearchBox, td, th, tr, usePaged } from "@/components/erp/table-tools";
import { pageHead } from "@/lib/meta";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/invoices/")({
  head: pageHead("Invoices", "Professional rental invoices with live paid and balance tracking."),
  component: Invoices,
});

function Invoices() {
  const { invoices, bookings, drivers, payments, addInvoice } = useStore();
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [f, setF] = useState<"all" | InvoiceStatus>("all");
  const [gen, setGen] = useState(false);
  const [bid, setBid] = useState("");
  const [draft, setDraft] = useState(false);
  const rows = invoices.map((i) => { const b = bookings.find((x) => x.id === i.bookingId); const total = b?.total ?? 0; const paid = b ? paidForBooking(b.id, payments) : 0;
    return { i, b, total, paid, st: invoiceStatus(i, total, paid), d: drivers.find((x) => x.id === b?.driverId) }; });
  const filtered = rows.filter((r) => (f === "all" || r.st === f) && `${r.i.number} ${r.d?.fullName} ${r.b?.ref}`.toLowerCase().includes(q.toLowerCase()));
  const { slice, controls } = usePaged(filtered);
  const eligible = bookings.filter((b) => b.status !== "cancelled" && !invoices.some((i) => i.bookingId === b.id && i.status !== "cancelled"));
  const n = (s: InvoiceStatus) => rows.filter((r) => r.st === s).length;

  const generate = () => {
    if (!bid) { toast.error("Select a booking"); return; }
    const inv = addInvoice(bid, { draft }); toast.success(`Invoice ${inv.number} generated`); setGen(false); nav({ to: "/invoices/$id", params: { id: inv.id } });
  };

  return (
    <div>
      <PageHeader title="Invoices" description="Invoices are generated from bookings." actions={<Button onClick={() => { setBid(""); setDraft(false); setGen(true); }}><Plus /> Generate Invoice</Button>} />
      {invoices.length === 0 ? (
        <Panel><EmptyState icon={FileText} title="No invoices yet" description="Generate an invoice from any booking — payments link to it automatically." action={<Button onClick={() => setGen(true)}><Plus /> Generate Invoice</Button>} /></Panel>
      ) : (
        <Panel>
          <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
            <FilterPills value={f} onChange={setF} options={[{ v: "all", l: "All", n: rows.length }, { v: "draft", l: "Draft", n: n("draft") }, { v: "issued", l: "Issued", n: n("issued") }, { v: "partially_paid", l: "Partially Paid", n: n("partially_paid") }, { v: "paid", l: "Paid", n: n("paid") }, { v: "overdue", l: "Overdue", n: n("overdue") }, { v: "cancelled", l: "Cancelled", n: n("cancelled") }]} />
            <SearchBox value={q} onChange={setQ} placeholder="Search invoice, driver…" />
          </div>
          <div className="overflow-x-auto"><table className="w-full">
            <thead><tr><th className={th}>Invoice</th><th className={th}>Driver</th><th className={th}>Booking</th><th className={th}>Issued</th><th className={th}>Due</th><th className={th}>Total</th><th className={th}>Paid</th><th className={th}>Balance</th><th className={th}>Status</th></tr></thead>
            <tbody>{slice.map(({ i, b, d, total, paid, st }) => (
              <tr key={i.id} className={`${tr} cursor-pointer`} onClick={() => nav({ to: "/invoices/$id", params: { id: i.id } })}>
                <td className={`${td} num font-medium`}>{i.number}</td><td className={td}>{d?.fullName ?? "—"}</td><td className={`${td} num`}>{b?.ref ?? "—"}</td>
                <td className={td}>{fmtDate(i.issueDate)}</td><td className={td}>{fmtDate(i.dueDate)}</td>
                <td className={`${td} num`}>{gbp(total)}</td><td className={`${td} num`}>{gbp(paid)}</td>
                <td className={cn(td, "num", total - paid > 0 && st !== "cancelled" && "text-destructive")}>{gbp(st === "cancelled" ? 0 : Math.max(0, total - paid))}</td>
                <td className={td}><StatusBadge status={st} /></td>
              </tr>
            ))}</tbody>
          </table>
          {filtered.length === 0 && <EmptyState compact icon={FileText} title="No matching invoices" />}</div>
          {controls}
        </Panel>
      )}
      <Dialog open={gen} onOpenChange={setGen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Generate invoice</DialogTitle><DialogDescription>Charges, driver and vehicle details are taken from the booking.</DialogDescription></DialogHeader>
          <Select value={bid} onValueChange={setBid}>
            <SelectTrigger><SelectValue placeholder={eligible.length ? "Select booking" : "No bookings awaiting an invoice"} /></SelectTrigger>
            <SelectContent>{eligible.map((b) => <SelectItem key={b.id} value={b.id}>{b.ref} · {drivers.find((d) => d.id === b.driverId)?.fullName} · {gbp(b.total)}</SelectItem>)}</SelectContent>
          </Select>
          <label className="flex items-center justify-between rounded-lg border p-3 text-sm"><span>Save as draft</span><Switch checked={draft} onCheckedChange={setDraft} /></label>
          <DialogFooter><Button variant="outline" onClick={() => setGen(false)}>Cancel</Button><Button onClick={generate} disabled={!eligible.length}>Generate</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
