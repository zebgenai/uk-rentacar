import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
export { monthlySeries } from "./series";

const Impl = lazy(() => import("./charts-impl").then((m) => ({ default: m.RevExpChart })));

export function RevExpChart(props: { data: Record<string, number | string>[]; keys?: string[] }) {
  return <Suspense fallback={<Skeleton className="h-72 w-full rounded-lg" />}><Impl {...props} /></Suspense>;
}
