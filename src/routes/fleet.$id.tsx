import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Pencil, Trash2, CalendarRange, Receipt, Wallet, TrendingUp, TrendingDown, PiggyBank, Plus, Car } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { bookingStatus, carFinancials, carStatus, fmtDate, gbp } from "@/lib/calc";
import { useUI } from "@/lib/ui";
import { EmptyState, KV, Panel, StatCard, StatusBadge } from "@/components/erp/common";
import { Confirm, td, th, tr } from "@/components/erp/table-tools";
import { CarForm } from "@/components/erp/forms";
import { pageHead } from "@/lib/meta";

export const Route = createFileRoute("/fleet/$id")({
  head: pageHead("Vehicle", "Vehicle overview, rental history and profitability."),
  component: CarDetail,
});

function CarDetail() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const { cars, bookings, drivers, payments, expenses, deleteCar } = useStore();
  const open = useUI((s) => s.open);
  const [edit, setEdit] = useState(false);
  const car = cars.find((c) => c.id === id);
  if (!car) return <Panel><EmptyState icon={Car} title="Vehicle not found" action={<Button asChild variant="outline"><Link to="/fleet">Back to fleet</Link></Button>} /></Panel>;
  const st = carStatus(car, bookings);
  const fin = carFinancials(car.id, bookings, payments, expenses);
  const mine = bookings.filter((b) => b.carId === car.id);
  const cur = mine.find((b) => b.status === "active") ?? mine.find((b) => b.status === "upcoming");
  const curDriver = cur && drivers.find((d) => d.id === cur.driverId);
  const bIds = new Set(mine.map((b) => b.id));
  const pays = payments.filter((p) => bIds.has(p.bookingId));
  const exps = expenses.filter((e) => e.carId === car.id);
  const dn = (i: string) => drivers.find((d) => d.id === i)?.fullName ?? "—";
  const hasActive = mine.some((b) => b.status === "active" || b.status === "upcoming");

  return (
    <div className="space-y-6">
      <Link to="/fleet" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Fleet</Link>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-3"><span className="num rounded-md border bg-warning/10 px-2.5 py-1 text-lg font-semibold">{car.registration}</span><StatusBadge status={st} /></div>
          <h1 className="mt-2 text-2xl font-semibold">{car.make} {car.model} <span className="text-muted-foreground font-normal">· {car.year}</span></h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => open("expense", { carId: car.id })}><Receipt /> Add Expense</Button>
          <Button variant="outline" size="sm" onClick={() => setEdit(true)}><Pencil /> Edit</Button>
          <Confirm trigger={<Button variant="outline" size="sm"><Trash2 /></Button>} title="Delete this vehicle?" description={hasActive ? "This car has an active or upcoming booking. Complete or cancel it first." : "The vehicle will be removed. Linked expenses become general business expenses."}
            onConfirm={() => { if (hasActive) { toast.error("Car has active bookings"); return; } deleteCar(car.id); toast.success("Vehicle deleted"); nav({ to: "/fleet" }); }} />
          <Button size="sm" disabled={st === "maintenance" || st === "inactive"} onClick={() => open("booking", { carId: car.id })}><Plus /> Book</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Revenue" value={gbp(fin.revenue)} icon={TrendingUp} tone="success" hint={`${fin.rentalDays} rental days`} />
        <StatCard label="Expenses" value={gbp(fin.expenses)} icon={TrendingDown} tone="warning" />
        <StatCard label="Net Profit" value={gbp(fin.profit)} icon={PiggyBank} tone={fin.profit < 0 ? "destructive" : "default"} hint="Revenue − Expenses" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Vehicle Overview">
          <div className="divide-y px-5 py-2">
            <KV k="Mileage" v={<span className="num">{car.mileage.toLocaleString("en-GB")} mi</span>} />
            <KV k="Colour" v={car.color || "—"} />
            <KV k="MOT expiry" v={fmtDate(car.motExpiry)} />
            <KV k="Insurance expiry" v={fmtDate(car.insuranceExpiry)} />
            <KV k="Purchase date" v={fmtDate(car.purchaseDate)} />
            <KV k="Purchase price" v={car.purchasePrice != null ? <span className="num">{gbp(car.purchasePrice)}</span> : "—"} />
          </div>
          {car.notes && <p className="border-t px-5 py-3 text-sm text-muted-foreground">{car.notes}</p>}
        </Panel>
        <Panel title="Current Booking" className="lg:col-span-2">
          {cur ? (
            <div className="grid gap-x-8 px-5 py-2 sm:grid-cols-2">
              <KV k="Booking" v={<Link to="/bookings/$id" params={{ id: cur.id }} className="num text-primary hover:underline">{cur.ref}</Link>} />
              <KV k="Driver" v={curDriver ? <Link to="/drivers/$id" params={{ id: curDriver.id }} className="hover:underline">{curDriver.fullName}</Link> : "—"} />
              <KV k="Pickup" v={`${fmtDate(cur.pickupDate)} ${cur.pickupTime}`} />
              <KV k="Return" v={`${fmtDate(cur.returnDate)} ${cur.returnTime}`} />
              <KV k="Status" v={<StatusBadge status={bookingStatus(cur)} />} />
              <KV k="Total" v={<span className="num">{gbp(cur.total)}</span>} />
            </div>
          ) : <EmptyState compact icon={CalendarRange} title="Not currently rented" description="This vehicle has no active or upcoming booking." />}
        </Panel>
      </div>

      <Panel title="Rental History">
        {mine.length === 0 ? <EmptyState compact icon={CalendarRange} title="No rentals yet" /> : (
          <div className="overflow-x-auto"><table className="w-full">
            <thead><tr><th className={th}>Ref</th><th className={th}>Driver</th><th className={th}>Period</th><th className={th}>Days</th><th className={th}>Total</th><th className={th}>Status</th></tr></thead>
            <tbody>{mine.map((b) => (
              <tr key={b.id} className={tr}><td className={td}><Link to="/bookings/$id" params={{ id: b.id }} className="num text-primary hover:underline">{b.ref}</Link></td><td className={td}>{dn(b.driverId)}</td><td className={td}>{fmtDate(b.pickupDate)} → {fmtDate(b.returnDate)}</td><td className={`${td} num`}>{b.days}</td><td className={`${td} num`}>{gbp(b.total)}</td><td className={td}><StatusBadge status={bookingStatus(b)} /></td></tr>
            ))}</tbody>
          </table></div>
        )}
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Payment History">
          {pays.length === 0 ? <EmptyState compact icon={Wallet} title="No payments yet" /> : (
            <ul className="divide-y">{pays.map((p) => <li key={p.id} className="flex justify-between px-5 py-3 text-sm"><span>{fmtDate(p.date)} · {dn(p.driverId)} <span className="text-muted-foreground">· {p.method}</span></span><span className="num text-success">+{gbp(p.amount)}</span></li>)}</ul>
          )}
        </Panel>
        <Panel title="Expense History">
          {exps.length === 0 ? <EmptyState compact icon={Receipt} title="No expenses yet" /> : (
            <ul className="divide-y">{exps.map((e) => <li key={e.id} className="flex justify-between px-5 py-3 text-sm"><span>{fmtDate(e.date)} · {e.category} <span className="text-muted-foreground">· {e.description}</span></span><span className="num">−{gbp(e.amount)}</span></li>)}</ul>
          )}
        </Panel>
      </div>
      <CarForm open={edit} onOpenChange={setEdit} car={car} />
    </div>
  );
}
