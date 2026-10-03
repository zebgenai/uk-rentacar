import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { gbp, gbp0 } from "@/lib/calc";

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
