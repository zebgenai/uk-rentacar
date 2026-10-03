import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { fmtDate, gbp, paidForBooking, sum } from "@/lib/calc";
import { useUI } from "@/lib/ui";
import { EmptyState, PageHeader, Panel } from "@/components/erp/common";
import { SearchBox, td, th, tr, usePaged } from "@/components/erp/table-tools";
import { pageHead } from "@/lib/meta";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/drivers/")({
  head: pageHead("Drivers", "Driver records, licences, rentals and balances."),
  component: Drivers,
});

function Drivers() {
  const { drivers, bookings, payments } = useStore();
  const open = useUI((s) => s.open);
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const filtered = drivers.filter((d) => `${d.fullName} ${d.phone} ${d.email} ${d.licenceNumber}`.toLowerCase().includes(q.toLowerCase()));
  const { slice, controls } = usePaged(filtered);
  const in30 = new Date(); in30.setDate(in30.getDate() + 30);

  return (
    <div>
      <PageHeader title="Drivers" description={`${drivers.length} registered driver${drivers.length === 1 ? "" : "s"}`} actions={<Button onClick={() => open("driver")}><Plus /> Add Driver</Button>} />
      {drivers.length === 0 ? (
        <Panel><EmptyState icon={Users} title="No drivers added yet" description="Add your first driver to start creating rentals." action={<Button onClick={() => open("driver")}><Plus /> Add Your First Driver</Button>} /></Panel>
      ) : (
        <Panel>
          <div className="flex justify-end border-b p-4"><SearchBox value={q} onChange={setQ} placeholder="Search name, phone, licence…" /></div>
          <div className="overflow-x-auto"><table className="w-full">
            <thead><tr><th className={th}>Driver</th><th className={th}>Phone</th><th className={th}>Licence</th><th className={th}>Licence Expiry</th><th className={th}>Rentals</th><th className={th}>Outstanding</th></tr></thead>
            <tbody>{slice.map((d) => {
              const mine = bookings.filter((b) => b.driverId === d.id && b.status !== "cancelled");
              const out = sum(mine.map((b) => Math.max(0, b.total - paidForBooking(b.id, payments))));
              const exp = new Date(d.licenceExpiry);
              return (
                <tr key={d.id} className={`${tr} cursor-pointer`} onClick={() => nav({ to: "/drivers/$id", params: { id: d.id } })}>
                  <td className={td}><p className="font-medium">{d.fullName}</p><p className="text-xs text-muted-foreground">{d.email || "—"}</p></td>
                  <td className={td}>{d.phone}</td>
                  <td className={`${td} num`}>{d.licenceNumber}</td>
                  <td className={cn(td, exp < new Date() ? "text-destructive" : exp < in30 ? "text-warning" : "")}>{fmtDate(d.licenceExpiry)}</td>
                  <td className={`${td} num`}>{mine.length}</td>
                  <td className={cn(td, "num", out > 0 && "font-medium text-destructive")}>{gbp(out)}</td>
                </tr>
              );
            })}</tbody>
          </table>
          {filtered.length === 0 && <EmptyState compact icon={Users} title="No matching drivers" />}
          </div>
          {controls}
        </Panel>
      )}
    </div>
  );
}
