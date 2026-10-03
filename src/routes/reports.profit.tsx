import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowDownUp, BarChart3, Car, PiggyBank, TrendingDown, TrendingUp, AlertCircle } from "lucide-react";
import { useStore } from "@/lib/store";
import { carFinancials, gbp, inRange, paidForBooking, sum } from "@/lib/calc";
import { EmptyState, PageHeader, Panel, StatCard, StatusBadge } from "@/components/erp/common";
import { ReportTabs, useReportRange } from "@/components/erp/report-filter";
import { RevExpChart, monthlySeries } from "@/components/erp/charts";
import { td, th, tr } from "@/components/erp/table-tools";
import { pageHead } from "@/lib/meta";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reports/profit")({
  head: pageHead("Profit Report", "Net profit, car profitability and outstanding balances."),
  component: ProfitReport,
});

type SortKey = "revenue" | "expenses" | "profit" | "rentalDays";

function ProfitReport() {
  const { payments, expenses, cars, bookings, drivers } = useStore();
  const { bounds, ui } = useReportRange();
  const [sort, setSort] = useState<SortKey>("profit");
  const ps = payments.filter((p) => inRange(p.date, bounds));
  const es = expenses.filter((e) => inRange(e.date, bounds));
  const rev = sum(ps.map((p) => p.amount)); const exp = sum(es.map((e) => e.amount));
  const rows = cars.map((c) => ({ c, ...carFinancials(c.id, bookings, ps, es) })).sort((a, b) => b[sort] - a[sort]);
  const outstanding = bookings.filter((b) => b.status !== "cancelled").map((b) => ({ b, bal: b.total - paidForBooking(b.id, payments) })).filter((x) => x.bal > 0.001);
  const SortTh = ({ k, l }: { k: SortKey; l: string }) => (
    <th className={`${th} text-right`}><button onClick={() => setSort(k)} className={cn("inline-flex items-center gap-1 uppercase hover:text-foreground", sort === k && "text-foreground")}>{l}<ArrowDownUp className="h-3 w-3" /></button></th>
  );

  return (
    <div>
      <PageHeader title="Reports" description="Total Revenue − Total Expenses = Net Profit" />
      <ReportTabs active="profit" />
      {ui}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Revenue" value={gbp(rev)} icon={TrendingUp} tone="success" />
        <StatCard label="Total Expenses" value={gbp(exp)} icon={TrendingDown} tone="warning" />
        <StatCard label="Net Profit" value={gbp(rev - exp)} icon={PiggyBank} tone={rev - exp < 0 ? "destructive" : "default"} />
      </div>
      <div className="space-y-6">
        <Panel title="Profit — last 12 months">
          {payments.length + expenses.length === 0 ? <EmptyState icon={BarChart3} title="Not enough data yet" description="Complete your first booking to start seeing business insights." /> : <div className="p-4"><RevExpChart data={monthlySeries(payments, expenses, 12)} keys={["Revenue", "Expenses", "Profit"]} /></div>}
        </Panel>
        <Panel title="Car Profitability">
          {cars.length === 0 ? <EmptyState icon={Car} title="No vehicle data available yet." /> : (
            <div className="overflow-x-auto"><table className="w-full">
              <thead><tr><th className={th}>Car</th><th className={th}>Registration</th><SortTh k="revenue" l="Revenue" /><SortTh k="expenses" l="Expenses" /><SortTh k="profit" l="Net Profit" /><SortTh k="rentalDays" l="Rental Days" /></tr></thead>
              <tbody>{rows.map((r) => (
                <tr key={r.c.id} className={tr}>
                  <td className={td}><Link to="/fleet/$id" params={{ id: r.c.id }} className="font-medium hover:underline">{r.c.make} {r.c.model}</Link></td>
                  <td className={`${td} num`}>{r.c.registration}</td>
                  <td className={`${td} num text-right`}>{gbp(r.revenue)}</td><td className={`${td} num text-right`}>{gbp(r.expenses)}</td>
                  <td className={cn(td, "num text-right font-semibold", r.profit < 0 ? "text-destructive" : r.profit > 0 && "text-success")}>{gbp(r.profit)}</td>
                  <td className={`${td} num text-right`}>{r.rentalDays}</td>
                </tr>
              ))}</tbody>
            </table></div>
          )}
        </Panel>
        <Panel title="Outstanding Payments">
          {outstanding.length === 0 ? <EmptyState compact icon={AlertCircle} title="Nothing outstanding" description="Unpaid booking balances will be listed here." /> : (
            <div className="overflow-x-auto"><table className="w-full">
              <thead><tr><th className={th}>Booking</th><th className={th}>Driver</th><th className={th}>Status</th><th className={`${th} text-right`}>Total</th><th className={`${th} text-right`}>Outstanding</th></tr></thead>
              <tbody>{outstanding.map(({ b, bal }) => (
                <tr key={b.id} className={tr}><td className={td}><Link to="/bookings/$id" params={{ id: b.id }} className="num text-primary hover:underline">{b.ref}</Link></td><td className={td}>{drivers.find((d) => d.id === b.driverId)?.fullName}</td><td className={td}><StatusBadge status={b.status} /></td><td className={`${td} num text-right`}>{gbp(b.total)}</td><td className={`${td} num text-right font-semibold text-destructive`}>{gbp(bal)}</td></tr>
              ))}</tbody>
            </table></div>
          )}
        </Panel>
      </div>
    </div>
  );
}
