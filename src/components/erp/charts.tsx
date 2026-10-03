import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import type { Expense, Payment } from "@/lib/store";
import { gbp, gbp0 } from "@/lib/calc";

export function monthlySeries(payments: Payment[], expenses: Expense[], months = 6) {
  const now = new Date();
  return Array.from({ length: months }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const revenue = payments.filter((p) => p.date.startsWith(key)).reduce((s, p) => s + p.amount, 0);
    const exp = expenses.filter((e) => e.date.startsWith(key)).reduce((s, e) => s + e.amount, 0);
    return { month: d.toLocaleDateString("en-GB", { month: "short" }), Revenue: revenue, Expenses: exp, Profit: revenue - exp };
  });
}

export function RevExpChart({ data, keys = ["Revenue", "Expenses"] }: { data: Record<string, number | string>[]; keys?: string[] }) {
  const colors: Record<string, string> = { Revenue: "var(--chart-1)", Expenses: "var(--chart-2)", Profit: "var(--chart-3)" };
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <BarChart data={data} barGap={4} margin={{ left: 0, right: 8, top: 8 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" />
          <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" tickFormatter={(v) => gbp0(v)} width={70} />
          <Tooltip cursor={{ fill: "var(--muted)" }} formatter={(v: number) => gbp(v)} contentStyle={{ borderRadius: 10, border: "1px solid var(--border)", fontSize: 12 }} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
          {keys.map((k) => <Bar key={k} dataKey={k} fill={colors[k]} radius={[4, 4, 0, 0]} maxBarSize={28} />)}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
