import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, TrendingUp, Users, Hash } from "lucide-react";
import { useStore } from "@/lib/store";
import { gbp, inRange, sum } from "@/lib/calc";
import { EmptyState, PageHeader, Panel, StatCard } from "@/components/erp/common";
import { ReportTabs, useReportRange } from "@/components/erp/report-filter";
import { RevExpChart, monthlySeries } from "@/components/erp/charts";
import { td, th, tr } from "@/components/erp/table-tools";
import { pageHead } from "@/lib/meta";

export const Route = createFileRoute("/reports/revenue")({
  head: pageHead("Revenue Report", "Revenue received over time and by driver."),
  component: RevenueReport,
});

function RevenueReport() {
  const { payments, drivers, expenses } = useStore();
  const { bounds, ui } = useReportRange();
  const ps = payments.filter((p) => inRange(p.date, bounds));
  const total = sum(ps.map((p) => p.amount));
  const byDriver = drivers.map((d) => { const mine = ps.filter((p) => p.driverId === d.id); return { d, n: mine.length, total: sum(mine.map((p) => p.amount)) }; }).filter((x) => x.total > 0).sort((a, b) => b.total - a.total);

  return (
    <div>
      <PageHeader title="Reports" description="Revenue is counted when payments are received." />
      <ReportTabs active="revenue" />
      {ui}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Revenue" value={gbp(total)} icon={TrendingUp} tone="success" />
        <StatCard label="Payments" value={String(ps.length)} icon={Hash} />
        <StatCard label="Paying Drivers" value={String(byDriver.length)} icon={Users} />
      </div>
      {payments.length === 0 ? <Panel><EmptyState icon={BarChart3} title="Not enough data yet" description="Complete your first booking to start seeing business insights." /></Panel> : (
        <div className="grid gap-6 xl:grid-cols-3">
          <Panel title="Revenue — last 12 months" className="xl:col-span-2"><div className="p-4"><RevExpChart data={monthlySeries(payments, expenses, 12)} keys={["Revenue"]} /></div></Panel>
          <Panel title="Driver Revenue">
            {byDriver.length === 0 ? <EmptyState compact icon={Users} title="No revenue in this period" /> : (
              <table className="w-full"><thead><tr><th className={th}>Driver</th><th className={th}>Payments</th><th className={`${th} text-right`}>Revenue</th></tr></thead>
                <tbody>{byDriver.map((x) => <tr key={x.d.id} className={tr}><td className={td}>{x.d.fullName}</td><td className={`${td} num`}>{x.n}</td><td className={`${td} num text-right`}>{gbp(x.total)}</td></tr>)}</tbody></table>
            )}
          </Panel>
        </div>
      )}
    </div>
  );
}
