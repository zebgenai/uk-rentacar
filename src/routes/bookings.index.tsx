import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarRange, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore, type BookingStatus } from "@/lib/store";
import { bookingStatus, fmtDate, gbp, paidForBooking } from "@/lib/calc";
import { useUI } from "@/lib/ui";
import { EmptyState, PageHeader, Panel, StatusBadge } from "@/components/erp/common";
import { FilterPills, SearchBox, td, th, tr, usePaged } from "@/components/erp/table-tools";
import { pageHead } from "@/lib/meta";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/bookings/")({
  head: pageHead("Bookings", "All rentals — upcoming, active, overdue and completed."),
  component: Bookings,
});

function Bookings() {
  const { bookings, drivers, cars, payments } = useStore();
  const open = useUI((s) => s.open);
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [f, setF] = useState<"all" | BookingStatus>("all");
  const rows = bookings.map((b) => ({ b, st: bookingStatus(b), d: drivers.find((x) => x.id === b.driverId), c: cars.find((x) => x.id === b.carId), paid: paidForBooking(b.id, payments) }));
  const filtered = rows.filter((r) => (f === "all" || r.st === f) && `${r.b.ref} ${r.d?.fullName} ${r.c?.registration} ${r.c?.make}`.toLowerCase().includes(q.toLowerCase()));
  const { slice, controls } = usePaged(filtered);
  const n = (s: BookingStatus) => rows.filter((r) => r.st === s).length;

  return (
    <div>
      <PageHeader title="Bookings" description="Every rental, from pickup to return." actions={<Button onClick={() => open("booking")}><Plus /> New Booking</Button>} />
      {bookings.length === 0 ? (
        <Panel><EmptyState icon={CalendarRange} title="No bookings yet" description={cars.length && drivers.length ? "Create your first rental booking." : "Add at least one car and one driver, then create your first rental booking."} action={<Button onClick={() => open("booking")}><Plus /> New Booking</Button>} /></Panel>
      ) : (
        <Panel>
          <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
            <FilterPills value={f} onChange={setF} options={[{ v: "all", l: "All", n: rows.length }, { v: "upcoming", l: "Upcoming", n: n("upcoming") }, { v: "active", l: "Active", n: n("active") }, { v: "overdue", l: "Overdue", n: n("overdue") }, { v: "completed", l: "Completed", n: n("completed") }, { v: "cancelled", l: "Cancelled", n: n("cancelled") }]} />
            <SearchBox value={q} onChange={setQ} placeholder="Search ref, driver, registration…" />
          </div>
          <div className="overflow-x-auto"><table className="w-full">
            <thead><tr><th className={th}>Ref</th><th className={th}>Driver</th><th className={th}>Car</th><th className={th}>Pickup</th><th className={th}>Return</th><th className={th}>Days</th><th className={th}>Total</th><th className={th}>Balance</th><th className={th}>Status</th></tr></thead>
            <tbody>{slice.map(({ b, st, d, c, paid }) => {
              const bal = b.status === "cancelled" ? 0 : Math.max(0, b.total - paid);
              return (
                <tr key={b.id} className={`${tr} cursor-pointer`} onClick={() => nav({ to: "/bookings/$id", params: { id: b.id } })}>
                  <td className={`${td} num font-medium`}>{b.ref}</td><td className={td}>{d?.fullName ?? "—"}</td>
                  <td className={td}><span className="num">{c?.registration ?? "—"}</span> <span className="text-xs text-muted-foreground">{c?.make} {c?.model}</span></td>
                  <td className={td}>{fmtDate(b.pickupDate)}</td><td className={td}>{fmtDate(b.returnDate)}</td>
                  <td className={`${td} num`}>{b.days}</td><td className={`${td} num`}>{gbp(b.total)}</td>
                  <td className={cn(td, "num", bal > 0 && "text-destructive")}>{gbp(bal)}</td><td className={td}><StatusBadge status={st} /></td>
                </tr>
              );
            })}</tbody>
          </table>
          {filtered.length === 0 && <EmptyState compact icon={CalendarRange} title="No matching bookings" />}
          </div>
          {controls}
        </Panel>
      )}
    </div>
  );
}
