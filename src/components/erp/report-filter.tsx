import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { rangeBounds, type Range } from "@/lib/calc";
import { FilterPills } from "./table-tools";
import { cn } from "@/lib/utils";

export function useReportRange() {
  const [r, setR] = useState<Range>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const bounds = rangeBounds(r, from, to);
  const ui = (
    <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center">
      <FilterPills value={r} onChange={setR} options={[{ v: "all", l: "All time" }, { v: "today", l: "Today" }, { v: "week", l: "This Week" }, { v: "month", l: "This Month" }, { v: "last_month", l: "Last Month" }, { v: "year", l: "This Year" }, { v: "custom", l: "Custom" }]} />
      {r === "custom" && <div className="flex items-center gap-2"><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" /><span className="text-muted-foreground">to</span><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" /></div>}
    </div>
  );
  return { bounds, ui };
}

export function ReportTabs({ active }: { active: "revenue" | "expenses" | "profit" }) {
  const tabs = [{ k: "revenue", l: "Revenue", to: "/reports/revenue" }, { k: "expenses", l: "Expenses", to: "/reports/expenses" }, { k: "profit", l: "Profit & Vehicles", to: "/reports/profit" }] as const;
  return (
    <div className="mb-4 flex gap-6 border-b">
      {tabs.map((t) => <Link key={t.k} to={t.to} className={cn("-mb-px border-b-2 pb-3 text-sm font-medium transition-colors", active === t.k ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>{t.l}</Link>)}
    </div>
  );
}
