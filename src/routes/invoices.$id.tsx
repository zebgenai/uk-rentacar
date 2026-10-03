import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Download, FileText, Printer, Send, Trash2, Wallet, XCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { fmtDate, gbp, invoiceStatus, paidForBooking } from "@/lib/calc";
import { useUI } from "@/lib/ui";
import { EmptyState, Panel, StatusBadge } from "@/components/erp/common";
import { Confirm } from "@/components/erp/table-tools";
import { pageHead } from "@/lib/meta";

export const Route = createFileRoute("/invoices/$id")({
  head: pageHead("Invoice", "Printable rental invoice with payment summary."),
  component: InvoiceDetail,
});

function InvoiceDetail() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const { invoices, bookings, drivers, cars, payments, settings, updateInvoice, deleteInvoice } = useStore();
  const open = useUI((s) => s.open);
  const inv = invoices.find((i) => i.id === id);
  const b = inv && bookings.find((x) => x.id === inv.bookingId);
  if (!inv || !b) return <Panel><EmptyState icon={FileText} title="Invoice not found" action={<Button asChild variant="outline"><Link to="/invoices">Back to invoices</Link></Button>} /></Panel>;
  const d = drivers.find((x) => x.id === b.driverId); const c = cars.find((x) => x.id === b.carId);
  const paid = paidForBooking(b.id, payments); const bal = Math.max(0, b.total - paid);
  const st = invoiceStatus(inv, b.total, paid);
  const pays = payments.filter((p) => p.bookingId === b.id);
  const noBiz = !settings.businessName;

  const download = () => { toast("Choose “Save as PDF” in the print dialog"); setTimeout(() => window.print(), 300); };

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link to="/invoices" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Invoices</Link>
        <div className="flex flex-wrap gap-2">
          {inv.status === "draft" && <Button size="sm" variant="outline" onClick={() => { updateInvoice(inv.id, { status: "issued" }); toast.success("Invoice issued"); }}><Send /> Issue</Button>}
          {inv.status !== "cancelled" && <Confirm trigger={<Button size="sm" variant="outline"><XCircle /> Cancel</Button>} label="Cancel invoice" title="Cancel this invoice?" description="You can generate a new invoice for this booking afterwards." onConfirm={() => { updateInvoice(inv.id, { status: "cancelled" }); toast.success("Invoice cancelled"); }} />}
          <Confirm trigger={<Button size="sm" variant="outline"><Trash2 /></Button>} title="Delete invoice?" description="Payments stay on the booking." onConfirm={() => { deleteInvoice(inv.id); toast.success("Invoice deleted"); nav({ to: "/invoices" }); }} />
          <Button size="sm" variant="outline" onClick={() => window.print()}><Printer /> Print</Button>
          <Button size="sm" variant="outline" onClick={download}><Download /> Download PDF</Button>
          {bal > 0 && inv.status !== "cancelled" && <Button size="sm" onClick={() => open("payment", { bookingId: b.id })}><Wallet /> Record Payment</Button>}
        </div>
      </div>
      {noBiz && (
        <div className="no-print flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm">
          <AlertTriangle className="h-4 w-4 text-warning" /> Your business details are empty. <Link to="/settings" className="font-medium underline">Add them in Settings</Link> so they appear on invoices.
        </div>
      )}

      <article className="print-area surface mx-auto max-w-4xl p-8 md:p-12">
        <header className="flex flex-col justify-between gap-6 border-b pb-8 sm:flex-row">
          <div>
            {settings.logo ? <img src={settings.logo} alt="" className="mb-3 h-12 object-contain" /> : null}
            <p className="text-lg font-semibold">{settings.businessName || "Your Business Name"}</p>
            <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{settings.address}</p>
            <p className="text-sm text-muted-foreground">{[settings.phone, settings.email, settings.website].filter(Boolean).join(" · ")}</p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Invoice</p>
            <p className="num mt-1 text-2xl font-semibold">{inv.number}</p>
            <div className="mt-2"><StatusBadge status={st} /></div>
            <p className="mt-3 text-sm text-muted-foreground">Issued {fmtDate(inv.issueDate)}</p>
            <p className="text-sm text-muted-foreground">Due {fmtDate(inv.dueDate)}</p>
          </div>
        </header>

        <section className="grid gap-8 py-8 sm:grid-cols-3">
          <div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Billed to</p>
            <p className="mt-2 font-medium">{d?.fullName}</p><p className="whitespace-pre-line text-sm text-muted-foreground">{d?.address}</p><p className="text-sm text-muted-foreground">{d?.phone}</p><p className="text-sm text-muted-foreground">{d?.email}</p></div>
          <div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Vehicle</p>
            <p className="num mt-2 font-medium">{c?.registration}</p><p className="text-sm text-muted-foreground">{c?.make} {c?.model} {c?.year}</p></div>
          <div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rental period</p>
            <p className="mt-2 text-sm">{fmtDate(b.pickupDate)} {b.pickupTime}</p><p className="text-sm">→ {fmtDate(b.returnDate)} {b.returnTime}</p><p className="num text-sm text-muted-foreground">{b.days} day{b.days === 1 ? "" : "s"} · Booking {b.ref}</p></div>
        </section>

        <table className="w-full text-sm">
          <thead><tr className="border-y text-xs uppercase tracking-wider text-muted-foreground"><th className="py-3 text-left font-medium">Description</th><th className="py-3 text-right font-medium">Qty</th><th className="py-3 text-right font-medium">Rate</th><th className="py-3 text-right font-medium">Amount</th></tr></thead>
          <tbody>
            <tr className="border-b"><td className="py-3">Vehicle rental — {c?.make} {c?.model}</td><td className="num py-3 text-right">{b.days}</td><td className="num py-3 text-right">{gbp(b.dailyRate)}</td><td className="num py-3 text-right">{gbp(b.dailyRate * b.days)}</td></tr>
            {b.additionalCharges > 0 && <tr className="border-b"><td className="py-3">Additional charges</td><td /><td /><td className="num py-3 text-right">{gbp(b.additionalCharges)}</td></tr>}
            {b.discount > 0 && <tr className="border-b"><td className="py-3">Discount</td><td /><td /><td className="num py-3 text-right">−{gbp(b.discount)}</td></tr>}
          </tbody>
        </table>

        <section className="mt-6 flex flex-col justify-between gap-8 sm:flex-row">
          <div className="text-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Payments received</p>
            {pays.length === 0 ? <p className="mt-2 text-muted-foreground">None yet</p> : <ul className="mt-2 space-y-1">{pays.map((p) => <li key={p.id} className="text-muted-foreground">{fmtDate(p.date)} · {p.method}{p.reference && ` · ${p.reference}`} — <span className="num text-foreground">{gbp(p.amount)}</span></li>)}</ul>}
          </div>
          <div className="w-full space-y-2 text-sm sm:w-72">
            <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span className="num">{gbp(b.total)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Paid</span><span className="num">−{gbp(paid)}</span></div>
            <div className="flex justify-between rounded-lg bg-primary px-4 py-3 text-primary-foreground"><span className="font-medium">Balance due</span><span className="num text-lg font-semibold">{gbp(st === "cancelled" ? 0 : bal)}</span></div>
          </div>
        </section>
        <footer className="mt-12 border-t pt-6 text-center text-xs text-muted-foreground">Thank you for your business{settings.businessName ? ` — ${settings.businessName}` : ""}.</footer>
      </article>
    </div>
  );
}
