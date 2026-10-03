import type { Expense, Payment } from "@/lib/store";

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

