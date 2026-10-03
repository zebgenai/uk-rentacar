import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, TrendingDown, Car, Building2 } from "lucide-react";
import { EXPENSE_CATEGORIES, useStore } from "@/lib/store";
import { gbp, inRange, sum } from "@/lib/calc";
import { EmptyState, PageHeader, Panel, StatCard } from "@/components/erp/common";
import { ReportTabs, useReportRange } from "@/components/erp/report-filter";
import { RevExpChart, monthlySeries } from "@/components/erp/charts";
import { pageHead } from "@/lib/meta";

export const Route = createFileRoute("/reports/expenses")({
  head: pageHead("Expense Report", "Business and vehicle costs by category and month."),
  component: ExpenseReport,
});

function ExpenseReport() {
  const { expenses, payments } = useStore();
  const { bounds, ui } = useReportRange();
  const es = expenses.filter((e) => inRange(e.date, bounds));
  const total = sum(es.map((e) => e.amount));
  const cats = EXPENSE_CATEGORIES.map((c) => ({ c, v: sum(es.filter((e) => e.category === c).map((e) => e.amount)) })).filter((x) => x.v > 0).sort((a, b) => b.v - a.v);

  return (
    <div>
      <PageHeader title="Reports" description="Every recorded expense, by category." />
      <ReportTabs active="expenses" />
      {ui}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Expenses" value={gbp(total)} icon={TrendingDown} tone="warning" />
        <StatCard label="Vehicle" value={gbp(sum(es.filter((e) => e.carId).map((e) => e.amount)))} icon={Car} />
        <StatCard label="General" value={gbp(sum(es.filter((e) => !e.carId).map((e) => e.amount)))} icon={Building2} />
      </div>
      {expenses.length === 0 ? <Panel><EmptyState icon={BarChart3} title="Not enough data yet" description="Record your first expense to see cost breakdowns." /></Panel> : (
        <div className="grid gap-6 xl:grid-cols-3">
          <Panel title="Expenses — last 12 months" className="xl:col-span-2"><div className="p-4"><RevExpChart data={monthlySeries(payments, expenses, 12)} keys={["Expenses"]} /></div></Panel>
          <Panel title="By Category">
            {cats.length === 0 ? <EmptyState compact icon={BarChart3} title="No expenses in this period" /> : (
              <ul className="space-y-4 p-5">{cats.map((x) => (
                <li key={x.c}><div className="mb-1.5 flex justify-between text-sm"><span>{x.c}</span><span className="num">{gbp(x.v)}</span></div>
                  <div className="h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-brass" style={{ width: `${(x.v / total) * 100}%` }} /></div></li>
              ))}</ul>
            )}
          </Panel>
        </div>
      )}
    </div>
  );
}
