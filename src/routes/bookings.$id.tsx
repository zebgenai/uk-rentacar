import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CalendarRange, CheckCircle2, FileText, Play, Trash2, Wallet, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { bookingStatus, fmtDate, gbp, paidForBooking } from "@/lib/calc";
import { useUI } from "@/lib/ui";
import { EmptyState, KV, Panel, StatusBadge } from "@/components/erp/common";
import { Confirm } from "@/components/erp/table-tools";
import { pageHead } from "@/lib/meta";

export const Route = createFileRoute("/bookings/$id")({
  head: pageHead("Booking", "Rental details, pricing, payments and invoice."),
  component: BookingDetail,
});

function BookingDetail() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const { bookings, drivers, cars, payments, invoices, updateBooking, deleteBooking, addInvoice, updateInvoice } = useStore();
  const open = useUI((s) => s.open);
  const b = bookings.find((x) => x.id === id);
  if (!b) return <Panel><EmptyState icon={CalendarRange} title="Booking not found" action={<Button asChild variant="outline"><Link to="/bookings">Back to bookings</Link></Button>} /></Panel>;
  const d = drivers.find((x) => x.id === b.driverId); const c = cars.find((x) => x.id === b.carId);
  const paid = paidForBooking(b.id, payments); const bal = Math.max(0, b.total - paid);
  const st = bookingStatus(b);
  const inv = invoices.find((i) => i.bookingId === b.id && i.status !== "cancelled");
  const pays = payments.filter((p) => p.bookingId === b.id);

  const setStatus = (s: typeof b.status, msg: string) => { updateBooking(b.id, { status: s }); toast.success(msg); };

  return (
    <div className="space-y-6">
      <Link to="/bookings" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Bookings</Link>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><div className="flex items-center gap-3"><h1 className="num text-2xl font-semibold">{b.ref}</h1><StatusBadge status={st} /></div>
          <p className="mt-1 text-sm text-muted-foreground">Created {fmtDate(b.createdAt)}</p></div>
        <div className="flex flex-wrap gap-2">
          {b.status === "upcoming" && <Button size="sm" variant="outline" onClick={() => setStatus("active", "Rental started — car is now On Rent")}><Play /> Start rental</Button>}
          {b.status === "active" && <Button size="sm" variant="outline" onClick={() => setStatus("completed", "Rental completed — car is now Available")}><CheckCircle2 /> Complete rental</Button>}
          {(b.status === "upcoming" || b.status === "active") && (
            <Confirm trigger={<Button size="sm" variant="outline"><XCircle /> Cancel</Button>} label="Cancel booking" title="Cancel this booking?" description="The car will be released. Recorded payments stay on file."
              onConfirm={() => { setStatus("cancelled", "Booking cancelled"); if (inv) updateInvoice(inv.id, { status: "cancelled" }); }} />
          )}
          <Confirm trigger={<Button size="sm" variant="outline"><Trash2 /></Button>} title="Delete this booking?" description="This also deletes its invoice and recorded payments. This cannot be undone."
            onConfirm={() => { deleteBooking(b.id); toast.success("Booking deleted"); nav({ to: "/bookings" }); }} />
          {inv ? <Button size="sm" variant="outline" asChild><Link to="/invoices/$id" params={{ id: inv.id }}><FileText /> {inv.number}</Link></Button>
            : b.status !== "cancelled" && <Button size="sm" variant="outline" onClick={() => { const i = addInvoice(b.id); toast.success(`Invoice ${i.number} generated`); nav({ to: "/invoices/$id", params: { id: i.id } }); }}><FileText /> Generate Invoice</Button>}
          {bal > 0 && b.status !== "cancelled" && <Button size="sm" onClick={() => open("payment", { bookingId: b.id })}><Wallet /> Record Payment</Button>}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Rental">
          <div className="divide-y px-5 py-2">
            <KV k="Driver" v={d ? <Link to="/drivers/$id" params={{ id: d.id }} className="hover:underline">{d.fullName}</Link> : "—"} />
            <KV k="Car" v={c ? <Link to="/fleet/$id" params={{ id: c.id }} className="hover:underline"><span className="num">{c.registration}</span> · {c.make} {c.model}</Link> : "—"} />
            <KV k="Pickup" v={`${fmtDate(b.pickupDate)} · ${b.pickupTime}`} />
            <KV k="Return" v={`${fmtDate(b.returnDate)} · ${b.returnTime}`} />
            <KV k="Duration" v={<span className="num">{b.days} day{b.days === 1 ? "" : "s"}</span>} />
          </div>
          {b.notes && <p className="border-t px-5 py-3 text-sm text-muted-foreground">{b.notes}</p>}
        </Panel>
        <Panel title="Pricing">
          <div className="divide-y px-5 py-2">
            <KV k="Daily rate" v={<span className="num">{gbp(b.dailyRate)}</span>} />
            <KV k={`Subtotal (${b.days} days)`} v={<span className="num">{gbp(b.dailyRate * b.days)}</span>} />
            <KV k="Additional charges" v={<span className="num">{gbp(b.additionalCharges)}</span>} />
            <KV k="Discount" v={<span className="num">−{gbp(b.discount)}</span>} />
            <KV k="Total" v={<span className="num text-base font-semibold">{gbp(b.total)}</span>} />
          </div>
        </Panel>
        <Panel title="Balance">
          <div className="p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Outstanding</p>
            <p className={`num mt-1 text-3xl font-semibold ${bal > 0 && b.status !== "cancelled" ? "text-destructive" : "text-success"}`}>{gbp(b.status === "cancelled" ? 0 : bal)}</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-success transition-all" style={{ width: `${b.total ? Math.min(100, (paid / b.total) * 100) : 0}%` }} /></div>
            <div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>Paid <span className="num">{gbp(paid)}</span></span><span>of <span className="num">{gbp(b.total)}</span></span></div>
          </div>
          <div className="border-t">
            {pays.length === 0 ? <p className="px-5 py-4 text-sm text-muted-foreground">No payments recorded yet.</p> : (
              <ul className="divide-y">{pays.map((p) => <li key={p.id} className="flex justify-between px-5 py-2.5 text-sm"><span>{fmtDate(p.date)} <span className="text-muted-foreground">· {p.method}</span></span><span className="num text-success">+{gbp(p.amount)}</span></li>)}</ul>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
