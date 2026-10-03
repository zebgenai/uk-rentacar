import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Pencil, Trash2, CalendarRange, FileText, Wallet, Plus, Users, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { bookingStatus, fmtDate, gbp, invoiceStatus, paidForBooking, sum } from "@/lib/calc";
import { useUI } from "@/lib/ui";
import { EmptyState, KV, Panel, StatCard, StatusBadge } from "@/components/erp/common";
import { Confirm, td, th, tr } from "@/components/erp/table-tools";
import { DriverForm } from "@/components/erp/forms";
import { pageHead } from "@/lib/meta";

export const Route = createFileRoute("/drivers/$id")({
  head: pageHead("Driver", "Driver profile, licence, rentals, invoices and payments."),
  component: DriverDetail,
});

function DriverDetail() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const { drivers, bookings, payments, invoices, cars, deleteDriver } = useStore();
  const open = useUI((s) => s.open);
  const [edit, setEdit] = useState(false);
  const d = drivers.find((x) => x.id === id);
  if (!d) return <Panel><EmptyState icon={Users} title="Driver not found" action={<Button asChild variant="outline"><Link to="/drivers">Back to drivers</Link></Button>} /></Panel>;
  const mine = bookings.filter((b) => b.driverId === d.id);
  const live = mine.filter((b) => b.status !== "cancelled");
  const invoiced = sum(live.map((b) => b.total));
  const pays = payments.filter((p) => p.driverId === d.id);
  const paid = sum(pays.map((p) => p.amount));
  const outstanding = sum(live.map((b) => Math.max(0, b.total - paidForBooking(b.id, payments))));
  const invs = invoices.filter((i) => mine.some((b) => b.id === i.bookingId));
  const cr = (i: string) => cars.find((c) => c.id === i)?.registration ?? "—";

  return (
    <div className="space-y-6">
      <Link to="/drivers" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Drivers</Link>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">{d.fullName.split(" ").map((w) => w[0]).slice(0, 2).join("")}</div>
          <div><h1 className="text-2xl font-semibold">{d.fullName}</h1><p className="text-sm text-muted-foreground">{d.phone}{d.email && ` · ${d.email}`}</p></div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setEdit(true)}><Pencil /> Edit</Button>
          <Confirm trigger={<Button variant="outline" size="sm"><Trash2 /></Button>} title="Delete this driver?" description={mine.length ? "This driver has bookings on record and can't be deleted." : "This driver record will be permanently removed."}
            onConfirm={() => { if (mine.length) { toast.error("Driver has bookings on record"); return; } deleteDriver(d.id); toast.success("Driver deleted"); nav({ to: "/drivers" }); }} />
          <Button size="sm" onClick={() => open("booking", { driverId: d.id })}><Plus /> New Booking</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Invoiced" value={gbp(invoiced)} icon={FileText} />
        <StatCard label="Total Paid" value={gbp(paid)} icon={CheckCircle2} tone="success" />
        <StatCard label="Outstanding Balance" value={gbp(outstanding)} icon={AlertCircle} tone={outstanding > 0 ? "destructive" : "default"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Personal Information"><div className="divide-y px-5 py-2">
          <KV k="Phone" v={d.phone} /><KV k="Email" v={d.email || "—"} /><KV k="Address" v={d.address || "—"} /><KV k="Date of birth" v={fmtDate(d.dob)} />
        </div>{d.notes && <p className="border-t px-5 py-3 text-sm text-muted-foreground">{d.notes}</p>}</Panel>
        <Panel title="Licence Information"><div className="divide-y px-5 py-2">
          <KV k="Licence number" v={<span className="num">{d.licenceNumber}</span>} />
          <KV k="Expiry" v={<span className={new Date(d.licenceExpiry) < new Date() ? "text-destructive" : ""}>{fmtDate(d.licenceExpiry)}{new Date(d.licenceExpiry) < new Date() && " · Expired"}</span>} />
        </div></Panel>
      </div>

      <Panel title="Rental History">
        {mine.length === 0 ? <EmptyState compact icon={CalendarRange} title="No rentals yet" action={<Button size="sm" onClick={() => open("booking", { driverId: d.id })}><Plus /> New Booking</Button>} /> : (
          <div className="overflow-x-auto"><table className="w-full">
            <thead><tr><th className={th}>Ref</th><th className={th}>Car</th><th className={th}>Period</th><th className={th}>Total</th><th className={th}>Balance</th><th className={th}>Status</th></tr></thead>
            <tbody>{mine.map((b) => (
              <tr key={b.id} className={tr}><td className={td}><Link to="/bookings/$id" params={{ id: b.id }} className="num text-primary hover:underline">{b.ref}</Link></td><td className={`${td} num`}>{cr(b.carId)}</td><td className={td}>{fmtDate(b.pickupDate)} → {fmtDate(b.returnDate)}</td><td className={`${td} num`}>{gbp(b.total)}</td><td className={`${td} num`}>{gbp(Math.max(0, b.total - paidForBooking(b.id, payments)))}</td><td className={td}><StatusBadge status={bookingStatus(b)} /></td></tr>
            ))}</tbody>
          </table></div>
        )}
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Invoices">
          {invs.length === 0 ? <EmptyState compact icon={FileText} title="No invoices yet" /> : (
            <ul className="divide-y">{invs.map((i) => { const b = bookings.find((x) => x.id === i.bookingId)!; const p = paidForBooking(b.id, payments); return (
              <li key={i.id}><Link to="/invoices/$id" params={{ id: i.id }} className="flex items-center justify-between px-5 py-3 text-sm hover:bg-muted/50"><span className="num">{i.number}</span><span className="flex items-center gap-3"><span className="num">{gbp(b.total)}</span><StatusBadge status={invoiceStatus(i, b.total, p)} /></span></Link></li>
            ); })}</ul>
          )}
        </Panel>
        <Panel title="Payments">
          {pays.length === 0 ? <EmptyState compact icon={Wallet} title="No payments yet" /> : (
            <ul className="divide-y">{pays.map((p) => <li key={p.id} className="flex justify-between px-5 py-3 text-sm"><span>{fmtDate(p.date)} <span className="text-muted-foreground">· {p.method}{p.reference && ` · ${p.reference}`}</span></span><span className="num text-success">+{gbp(p.amount)}</span></li>)}</ul>
          )}
        </Panel>
      </div>
      <DriverForm open={edit} onOpenChange={setEdit} driver={d} />
    </div>
  );
}
