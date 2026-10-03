import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Car, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore, type CarStatus } from "@/lib/store";
import { carStatus } from "@/lib/calc";
import { useUI } from "@/lib/ui";
import { EmptyState, PageHeader, Panel, StatusBadge } from "@/components/erp/common";
import { FilterPills, SearchBox, td, th, tr, usePaged } from "@/components/erp/table-tools";
import { pageHead } from "@/lib/meta";

export const Route = createFileRoute("/fleet/")({
  head: pageHead("Fleet", "Your vehicle register — status, mileage and current rentals."),
  component: Fleet,
});

type F = "all" | CarStatus;

function Fleet() {
  const { cars, bookings, drivers } = useStore();
  const open = useUI((s) => s.open);
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [f, setF] = useState<F>("all");
  const rows = useMemo(() => cars.map((c) => {
    const st = carStatus(c, bookings);
    const cur = bookings.find((b) => b.carId === c.id && b.status === "active") ?? bookings.find((b) => b.carId === c.id && b.status === "upcoming");
    return { c, st, cur, driver: cur ? drivers.find((d) => d.id === cur.driverId) : undefined };
  }), [cars, bookings, drivers]);
  const filtered = rows.filter((r) => (f === "all" || r.st === f) && `${r.c.registration} ${r.c.make} ${r.c.model} ${r.c.color}`.toLowerCase().includes(q.toLowerCase()));
  const { slice, controls } = usePaged(filtered);
  const count = (s: CarStatus) => rows.filter((r) => r.st === s).length;

  return (
    <div>
      <PageHeader title="Fleet" description={`${cars.length} vehicle${cars.length === 1 ? "" : "s"} in your register`} actions={<Button onClick={() => open("car")}><Plus /> Add Car</Button>} />
      {cars.length === 0 ? (
        <Panel><EmptyState icon={Car} title="No vehicles added yet" description="Start by adding your first vehicle to your fleet." action={<Button onClick={() => open("car")}><Plus /> Add Vehicle</Button>} /></Panel>
      ) : (
        <Panel>
          <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
            <FilterPills value={f} onChange={setF} options={[
              { v: "all", l: "All", n: rows.length }, { v: "available", l: "Available", n: count("available") }, { v: "booked", l: "Booked", n: count("booked") },
              { v: "on_rent", l: "On Rent", n: count("on_rent") }, { v: "maintenance", l: "Maintenance", n: count("maintenance") }, { v: "inactive", l: "Inactive", n: count("inactive") },
            ]} />
            <SearchBox value={q} onChange={setQ} placeholder="Search registration, make, model…" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr><th className={th}>Registration</th><th className={th}>Make & Model</th><th className={th}>Year</th><th className={th}>Mileage</th><th className={th}>Status</th><th className={th}>Current Driver</th><th className={th}>Current Rental</th><th className={th}></th></tr></thead>
              <tbody>
                {slice.map(({ c, st, cur, driver }) => (
                  <tr key={c.id} className={`${tr} cursor-pointer`} onClick={() => nav({ to: "/fleet/$id", params: { id: c.id } })}>
                    <td className={td}><span className="num rounded-md border bg-warning/10 px-2 py-0.5 font-semibold">{c.registration}</span></td>
                    <td className={td}><span className="font-medium">{c.make} {c.model}</span>{c.color && <span className="ml-2 text-xs text-muted-foreground">{c.color}</span>}</td>
                    <td className={`${td} num`}>{c.year}</td>
                    <td className={`${td} num`}>{c.mileage.toLocaleString("en-GB")} mi</td>
                    <td className={td}><StatusBadge status={st} /></td>
                    <td className={td}>{driver?.fullName ?? <span className="text-muted-foreground">—</span>}</td>
                    <td className={td}>{cur ? <span className="num text-xs">{cur.ref}</span> : <span className="text-muted-foreground">—</span>}</td>
                    <td className={`${td} text-right`}><Link to="/fleet/$id" params={{ id: c.id }} className="text-xs font-medium text-primary hover:underline" onClick={(e) => e.stopPropagation()}>View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <EmptyState compact icon={Car} title="No matching vehicles" description="Try a different filter or search." />}
          </div>
          {controls}
        </Panel>
      )}
    </div>
  );
}
