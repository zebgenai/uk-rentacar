import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Receipt, Trash2, Car, Building2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EXPENSE_CATEGORIES, useStore } from "@/lib/store";
import { fmtDate, gbp, sum } from "@/lib/calc";
import { useUI } from "@/lib/ui";
import { EmptyState, PageHeader, Panel, StatCard } from "@/components/erp/common";
import { Confirm, FilterPills, SearchBox, td, th, tr, usePaged } from "@/components/erp/table-tools";
import { pageHead } from "@/lib/meta";

export const Route = createFileRoute("/expenses")({
  head: pageHead("Expenses", "Vehicle and business costs, linked to car profitability."),
  component: Expenses,
});

function Expenses() {
  const { expenses, cars, deleteExpense } = useStore();
  const open = useUI((s) => s.open);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const cr = (id?: string) => cars.find((c) => c.id === id);
  const filtered = expenses.filter((e) => (cat === "all" || e.category === cat) && `${e.description} ${e.reference} ${cr(e.carId)?.registration ?? ""}`.toLowerCase().includes(q.toLowerCase()));
  const { slice, controls } = usePaged(filtered);
  const used = EXPENSE_CATEGORIES.filter((c) => expenses.some((e) => e.category === c));

  return (
    <div className="space-y-6">
      <PageHeader title="Expenses" description="Track every cost related to your vehicles and business." actions={<Button onClick={() => open("expense")}><Plus /> Add Expense</Button>} />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Expenses" value={gbp(sum(expenses.map((e) => e.amount)))} icon={Receipt} tone="warning" hint={`${expenses.length} recorded`} />
        <StatCard label="Vehicle Expenses" value={gbp(sum(expenses.filter((e) => e.carId).map((e) => e.amount)))} icon={Car} />
        <StatCard label="General Business" value={gbp(sum(expenses.filter((e) => !e.carId).map((e) => e.amount)))} icon={Building2} />
      </div>
      <Panel>
        {expenses.length === 0 ? <EmptyState icon={Receipt} title="No expenses recorded yet" description="Repairs, servicing, tyres, MOT, insurance — link to a car to track its profit." action={<Button onClick={() => open("expense")}><Plus /> Add Expense</Button>} /> : (
          <>
            <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
              <FilterPills value={cat} onChange={setCat} options={[{ v: "all", l: "All", n: expenses.length }, ...used.map((c) => ({ v: c, l: c, n: expenses.filter((e) => e.category === c).length }))]} />
              <SearchBox value={q} onChange={setQ} placeholder="Search description, car…" />
            </div>
            <div className="overflow-x-auto"><table className="w-full">
              <thead><tr><th className={th}>Date</th><th className={th}>Category</th><th className={th}>Description</th><th className={th}>Car</th><th className={th}>Method</th><th className={th}>Reference</th><th className={th}>Amount</th><th className={th}></th></tr></thead>
              <tbody>{slice.map((e) => { const c = cr(e.carId); return (
                <tr key={e.id} className={tr}>
                  <td className={td}>{fmtDate(e.date)}</td><td className={td}><span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium">{e.category}</span></td>
                  <td className={td}>{e.description}</td>
                  <td className={td}>{c ? <Link to="/fleet/$id" params={{ id: c.id }} className="num text-primary hover:underline">{c.registration}</Link> : <span className="text-muted-foreground">General</span>}</td>
                  <td className={td}>{e.method}</td><td className={td}>{e.reference || "—"}</td>
                  <td className={`${td} num font-medium`}>{gbp(e.amount)}</td>
                  <td className={`${td} text-right`}><Confirm trigger={<Button variant="ghost" size="icon" aria-label="Delete"><Trash2 /></Button>} title="Delete expense?" description="Profit figures will be recalculated." onConfirm={() => { deleteExpense(e.id); toast.success("Expense deleted"); }} /></td>
                </tr>
              ); })}</tbody>
            </table></div>
            {controls}
          </>
        )}
      </Panel>
    </div>
  );
}
