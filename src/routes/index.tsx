import { createFileRoute, Link } from "@tanstack/react-router";
import { Car, CalendarRange, Users, Wallet, Receipt, TrendingUp, TrendingDown, PiggyBank, AlertCircle, Check, ArrowRight, BarChart3, Plus, KeyRound, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useStore } from "@/lib/store";
import { bookingStatus, carStatus, fmtDate, gbp, outstandingTotal, sum } from "@/lib/calc";
import { useUI } from "@/lib/ui";
import { EmptyState, Panel, StatCard, StatusBadge } from "@/components/erp/common";
import { RevExpChart, monthlySeries } from "@/components/erp/charts";
import { pageHead } from "@/lib/meta";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: pageHead("Dashboard", "Live overview of your fleet, rentals, revenue, expenses and profit."),
  component: Dashboard,
});

function Dashboard() {
  const { cars, drivers, bookings, payments, expenses, invoices, settings } = useStore();
  const open = useUI((s) => s.open);
  const revenue = sum(payments.map((p) => p.amount));
  const exp = sum(expenses.map((e) => e.amount));
  const profit = revenue - exp;
  const statuses = cars.map((c) => carStatus(c, bookings));
  const active = bookings.filter((b) => b.status === "active").length;
  const available = statuses.filter((s) => s === "available").length;
  const outstanding = outstandingTotal(bookings, payments);
  const series = monthlySeries(payments, expenses);
  const hasFin = payments.length + expenses.length > 0;
  const dn = (id: string) => drivers.find((d) => d.id === id)?.fullName ?? "—";
  const cr = (id?: string) => cars.find((c) => c.id === id)?.registration ?? "—";

  const steps = [
    { t: "Add your first car", done: cars.length > 0, act: () => open("car"), icon: Car },
    { t: "Add a driver", done: drivers.length > 0, act: () => open("driver"), icon: Users },
    { t: "Create a booking", done: bookings.length > 0, act: () => open("booking"), icon: CalendarRange },
    { t: "Generate an invoice", done: invoices.length > 0, to: "/invoices" as const, icon: FileText },
    { t: "Record payment", done: payments.length > 0, act: () => open("payment"), icon: Wallet },
    { t: "Track expenses", done: expenses.length > 0, act: () => open("expense"), icon: Receipt },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  const returns = bookings.filter((b) => b.status === "active").sort((a, b) => a.returnDate.localeCompare(b.returnDate)).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
          <h1 className="mt-1 text-2xl font-semibold">{settings.businessName ? `${settings.businessName} overview` : "Business overview"}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => open("car")}><Car /> Add Car</Button>
          <Button variant="outline" size="sm" onClick={() => open("driver")}><Users /> Add Driver</Button>
          <Button variant="outline" size="sm" onClick={() => open("expense")}><Receipt /> Add Expense</Button>
          <Button size="sm" onClick={() => open("booking")}><Plus /> New Booking</Button>
        </div>
      </div>

      {doneCount < steps.length && (
        <section className="surface relative overflow-hidden p-6">
          <div className="dot-grid pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-50 [mask-image:linear-gradient(to_left,black,transparent)]" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center">
            <div className="lg:w-72">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brass"><KeyRound className="h-3.5 w-3.5" /> Getting started</div>
              <h2 className="text-lg font-semibold">Set up your rental operation</h2>
              <p className="mt-1 text-sm text-muted-foreground">Follow the workflow — every number on this dashboard comes from what you enter.</p>
              <div className="mt-4 flex items-center gap-3"><Progress value={(doneCount / steps.length) * 100} className="h-1.5" /><span className="num text-xs text-muted-foreground">{doneCount}/{steps.length}</span></div>
            </div>
            <ol className="grid flex-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {steps.map((s, i) => {
                const inner = (
                  <>
                    <span className={cn("num flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs", s.done ? "border-success bg-success text-primary-foreground" : "bg-card")}>{s.done ? <Check className="h-3.5 w-3.5" /> : i + 1}</span>
                    <span className={cn("flex-1 text-sm", s.done && "text-muted-foreground line-through")}>{s.t}</span>
                    {!s.done && <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />}
                  </>
                );
                const cls = "group flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5 text-left transition-all hover:border-ring/40 hover:shadow-[var(--shadow-card)]";
                return <li key={s.t}>{s.to ? <Link to={s.to} className={cls}>{inner}</Link> : <button onClick={s.act} disabled={s.done} className={cn(cls, "w-full")}>{inner}</button>}</li>;
              })}
            </ol>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total Cars" value={String(cars.length)} icon={Car} hint={`${available} available`} />
        <StatCard label="Active Rentals" value={String(active)} icon={CalendarRange} hint={`${drivers.length} drivers`} />
        <StatCard label="Revenue" value={gbp(revenue)} icon={TrendingUp} tone="success" hint="Payments received" />
        <StatCard label="Expenses" value={gbp(exp)} icon={TrendingDown} tone="warning" hint="All recorded costs" />
        <StatCard label="Net Profit" value={gbp(profit)} icon={PiggyBank} tone={profit < 0 ? "destructive" : "default"} hint="Revenue − Expenses" />
        <StatCard label="Outstanding" value={gbp(outstanding)} icon={AlertCircle} tone={outstanding > 0 ? "destructive" : "default"} hint="Unpaid balances" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="Revenue Overview" className="xl:col-span-2" action={<Link to="/reports/profit" className="text-xs text-muted-foreground hover:text-foreground">View report →</Link>}>
          {hasFin ? <div className="p-4"><RevExpChart data={series} /></div> : (
            <EmptyState icon={BarChart3} title="No financial data yet" description="Create your first booking to start tracking revenue." action={<Button size="sm" onClick={() => open("booking")}><Plus /> New Booking</Button>} />
          )}
        </Panel>
        <Panel title="Upcoming Returns">
          {returns.length === 0 ? <EmptyState compact icon={CalendarRange} title="No upcoming returns" description="Active rentals and their return dates appear here." /> : (
            <ul className="divide-y">
              {returns.map((b) => (
                <li key={b.id}><Link to="/bookings/$id" params={{ id: b.id }} className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-muted/50">
                  <div><p className="num text-sm font-medium">{cr(b.carId)}</p><p className="text-xs text-muted-foreground">{dn(b.driverId)}</p></div>
                  <div className="text-right"><p className="text-xs">{fmtDate(b.returnDate)} · {b.returnTime}</p><StatusBadge status={bookingStatus(b)} /></div>
                </Link></li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Recent Bookings" action={<Link to="/bookings" className="text-xs text-muted-foreground hover:text-foreground">All →</Link>}>
          {bookings.length === 0 ? <EmptyState compact icon={CalendarRange} title="No bookings yet" description="Create your first rental booking." /> : (
            <ul className="divide-y">{bookings.slice(0, 5).map((b) => (
              <li key={b.id}><Link to="/bookings/$id" params={{ id: b.id }} className="flex items-center justify-between px-5 py-3 hover:bg-muted/50">
                <div><p className="text-sm font-medium"><span className="num">{b.ref}</span> · {dn(b.driverId)}</p><p className="text-xs text-muted-foreground">{fmtDate(b.pickupDate)} → {fmtDate(b.returnDate)}</p></div>
                <span className="num text-sm">{gbp(b.total)}</span>
              </Link></li>
            ))}</ul>
          )}
        </Panel>
        <Panel title="Recent Payments" action={<Link to="/payments" className="text-xs text-muted-foreground hover:text-foreground">All →</Link>}>
          {payments.length === 0 ? <EmptyState compact icon={Wallet} title="No payments recorded yet" description="Payments from drivers will appear here." /> : (
            <ul className="divide-y">{payments.slice(0, 5).map((p) => (
              <li key={p.id} className="flex items-center justify-between px-5 py-3">
                <div><p className="text-sm font-medium">{dn(p.driverId)}</p><p className="text-xs text-muted-foreground">{fmtDate(p.date)} · {p.method}</p></div>
                <span className="num text-sm text-success">+{gbp(p.amount)}</span>
              </li>
            ))}</ul>
          )}
        </Panel>
        <Panel title="Recent Expenses" action={<Link to="/expenses" className="text-xs text-muted-foreground hover:text-foreground">All →</Link>}>
          {expenses.length === 0 ? <EmptyState compact icon={Receipt} title="No expenses recorded yet" description="Repairs, servicing, insurance and more." /> : (
            <ul className="divide-y">{expenses.slice(0, 5).map((e) => (
              <li key={e.id} className="flex items-center justify-between px-5 py-3">
                <div><p className="text-sm font-medium">{e.category} · {e.description}</p><p className="text-xs text-muted-foreground">{fmtDate(e.date)} · {e.carId ? cr(e.carId) : "General"}</p></div>
                <span className="num text-sm">−{gbp(e.amount)}</span>
              </li>
            ))}</ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
