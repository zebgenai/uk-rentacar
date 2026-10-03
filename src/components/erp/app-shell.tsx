import { useMemo, useState, useEffect, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Car, Users, CalendarRange, Wallet, FileText, Receipt, BarChart3, Settings, LogOut, Search, Bell,
  TrendingUp, TrendingDown, PiggyBank, ChevronDown, Plus, KeyRound,
} from "lucide-react";
import { toast } from "sonner";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, SidebarProvider, SidebarTrigger, useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useStore } from "@/lib/store";
import { bookingStatus, fmtDate, gbp, paidForBooking, useHydrateStore } from "@/lib/calc";
import { useUI } from "@/lib/ui";
import { BookingForm, CarForm, DriverForm, ExpenseForm, PaymentForm } from "./forms";

const TITLES: [string, string][] = [
  ["/fleet", "Fleet"], ["/drivers", "Drivers"], ["/bookings", "Bookings"], ["/payments", "Payments"], ["/invoices", "Invoices"],
  ["/expenses", "Expenses"], ["/reports/revenue", "Revenue Report"], ["/reports/expenses", "Expense Report"], ["/reports/profit", "Profit Report"],
  ["/settings", "Settings"],
];

function initials(s: string) {
  return s.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "—";
}

function AppSidebar() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const { state } = useSidebar();
  const settings = useStore((s) => s.settings);
  const is = (p: string) => (p === "/" ? path === "/" : path.startsWith(p));
  const main = [
    { t: "Dashboard", u: "/", i: LayoutDashboard },
    { t: "Drivers", u: "/drivers", i: Users },
    { t: "Bookings", u: "/bookings", i: CalendarRange },
    { t: "Payments", u: "/payments", i: Wallet },
    { t: "Invoices", u: "/invoices", i: FileText },
    { t: "Expenses", u: "/expenses", i: Receipt },
  ] as const;
  const reports = [
    { t: "Revenue", u: "/reports/revenue", i: TrendingUp },
    { t: "Expenses", u: "/reports/expenses", i: TrendingDown },
    { t: "Profit", u: "/reports/profit", i: PiggyBank },
  ] as const;

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="px-3 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"><KeyRound className="h-4 w-4" /></div>
          {state === "expanded" && (
            <div className="min-w-0 leading-tight">
              <p className="text-sm font-semibold text-sidebar-accent-foreground">FleetLedger</p>
              <p className="text-[11px] text-sidebar-foreground/60">Rental ERP</p>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent className="px-1">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={is("/") && path === "/"} tooltip="Dashboard">
                  <Link to="/"><LayoutDashboard /><span>Dashboard</span></Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <Collapsible defaultOpen className="group/c">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip="Fleet"><Car /><span>Fleet</span><ChevronDown className="ml-auto transition-transform group-data-[state=open]/c:rotate-180" /></SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem><SidebarMenuSubButton asChild isActive={is("/fleet")}><Link to="/fleet">Cars</Link></SidebarMenuSubButton></SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
              {main.slice(1).map((m) => (
                <SidebarMenuItem key={m.u}>
                  <SidebarMenuButton asChild isActive={is(m.u)} tooltip={m.t}><Link to={m.u}><m.i /><span>{m.t}</span></Link></SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <Collapsible defaultOpen className="group/r">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip="Reports" isActive={is("/reports")}><BarChart3 /><span>Reports</span><ChevronDown className="ml-auto transition-transform group-data-[state=open]/r:rotate-180" /></SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {reports.map((r) => (
                        <SidebarMenuSubItem key={r.u}><SidebarMenuSubButton asChild isActive={is(r.u)}><Link to={r.u}>{r.t}</Link></SidebarMenuSubButton></SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={is("/settings")} tooltip="Settings"><Link to="/settings"><Settings /><span>Settings</span></Link></SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-xs font-semibold text-sidebar-accent-foreground">{initials(settings.userName || settings.businessName)}</div>
          {state === "expanded" && (
            <>
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-sm font-medium text-sidebar-accent-foreground">{settings.userName || "Owner"}</p>
                <p className="truncate text-[11px] text-sidebar-foreground/60">{settings.businessName || "Set business name"}</p>
              </div>
              <button aria-label="Logout" onClick={() => toast("You're in demo mode", { description: "Sign-in can be enabled when you go live." })} className="rounded-md p-1.5 text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"><LogOut className="h-4 w-4" /></button>
            </>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

function useNotifications() {
  const { bookings, cars, drivers, payments } = useStore();
  return useMemo(() => {
    const out: { id: string; tone: "warning" | "destructive" | "info"; title: string; body: string; to: string }[] = [];
    const now = new Date(); const soon = new Date(); soon.setDate(soon.getDate() + 2);
    const in30 = new Date(); in30.setDate(in30.getDate() + 30);
    for (const b of bookings) {
      const st = bookingStatus(b); const car = cars.find((c) => c.id === b.carId);
      const ret = new Date(`${b.returnDate}T${b.returnTime}`);
      if (st === "overdue") out.push({ id: "o" + b.id, tone: "destructive", title: `Overdue return · ${b.ref}`, body: `${car?.registration ?? ""} was due back ${fmtDate(b.returnDate)}`, to: `/bookings/${b.id}` });
      else if (st === "active" && ret <= soon) out.push({ id: "u" + b.id, tone: "info", title: `Upcoming return · ${b.ref}`, body: `${car?.registration ?? ""} due ${fmtDate(b.returnDate)} ${b.returnTime}`, to: `/bookings/${b.id}` });
      const bal = b.total - paidForBooking(b.id, payments);
      if (b.status !== "cancelled" && b.status !== "upcoming" && bal > 0.001) {
        const d = drivers.find((x) => x.id === b.driverId);
        out.push({ id: "p" + b.id, tone: "warning", title: `Outstanding ${gbp(bal)}`, body: `${d?.fullName ?? "Driver"} · ${b.ref}`, to: `/bookings/${b.id}` });
      }
    }
    for (const c of cars) {
      if (c.motExpiry && new Date(c.motExpiry) <= in30) out.push({ id: "m" + c.id, tone: new Date(c.motExpiry) < now ? "destructive" : "warning", title: `MOT ${new Date(c.motExpiry) < now ? "expired" : "expiring"} · ${c.registration}`, body: fmtDate(c.motExpiry), to: `/fleet/${c.id}` });
      if (c.insuranceExpiry && new Date(c.insuranceExpiry) <= in30) out.push({ id: "i" + c.id, tone: new Date(c.insuranceExpiry) < now ? "destructive" : "warning", title: `Insurance ${new Date(c.insuranceExpiry) < now ? "expired" : "expiring"} · ${c.registration}`, body: fmtDate(c.insuranceExpiry), to: `/fleet/${c.id}` });
      if (c.status === "maintenance") out.push({ id: "mt" + c.id, tone: "info", title: `In maintenance · ${c.registration}`, body: `${c.make} ${c.model}`, to: `/fleet/${c.id}` });
    }
    return out;
  }, [bookings, cars, drivers, payments]);
}

function Notifications() {
  const items = useNotifications();
  const nav = useNavigate();
  const toneCls = { warning: "bg-warning", destructive: "bg-destructive", info: "bg-info" };
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {items.length > 0 && <span className="num absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] text-destructive-foreground">{items.length}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b px-4 py-3 text-sm font-semibold">Notifications</div>
        {items.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">You're all caught up.<br /><span className="text-xs">Alerts appear here for returns, balances, MOT and insurance.</span></div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {items.map((n) => (
              <button key={n.id} onClick={() => nav({ to: n.to })} className="flex w-full gap-3 border-b px-4 py-3 text-left transition-colors last:border-0 hover:bg-muted">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${toneCls[n.tone]}`} />
                <span><span className="block text-sm font-medium">{n.title}</span><span className="block text-xs text-muted-foreground">{n.body}</span></span>
              </button>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const { cars, drivers, bookings, invoices, payments } = useStore();
  const nav = useNavigate();
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setOpen((o) => !o); } };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, []);
  const go = (to: string) => { setOpen(false); nav({ to }); };
  const dn = (id: string) => drivers.find((d) => d.id === id)?.fullName ?? "";
  return (
    <>
      <button onClick={() => setOpen(true)} className="flex h-9 w-full max-w-xs items-center gap-2 rounded-lg border bg-background px-3 text-sm text-muted-foreground transition-colors hover:border-ring/40">
        <Search className="h-4 w-4" /><span className="flex-1 text-left">Search everything…</span>
        <kbd className="num hidden rounded border bg-muted px-1.5 text-[10px] sm:inline">⌘K</kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search cars, drivers, bookings, invoices, payments…" />
        <CommandList>
          <CommandEmpty>No matching records.</CommandEmpty>
          {cars.length > 0 && <CommandGroup heading="Cars">{cars.map((c) => <CommandItem key={c.id} value={`car ${c.registration} ${c.make} ${c.model}`} onSelect={() => go(`/fleet/${c.id}`)}><Car /> <span className="num">{c.registration}</span><span className="text-muted-foreground">{c.make} {c.model}</span></CommandItem>)}</CommandGroup>}
          {drivers.length > 0 && <CommandGroup heading="Drivers">{drivers.map((d) => <CommandItem key={d.id} value={`driver ${d.fullName} ${d.phone} ${d.email} ${d.licenceNumber}`} onSelect={() => go(`/drivers/${d.id}`)}><Users /> {d.fullName}<span className="text-muted-foreground">{d.phone}</span></CommandItem>)}</CommandGroup>}
          {bookings.length > 0 && <CommandGroup heading="Bookings">{bookings.map((b) => <CommandItem key={b.id} value={`booking ${b.ref} ${dn(b.driverId)}`} onSelect={() => go(`/bookings/${b.id}`)}><CalendarRange /> <span className="num">{b.ref}</span><span className="text-muted-foreground">{dn(b.driverId)}</span></CommandItem>)}</CommandGroup>}
          {invoices.length > 0 && <CommandGroup heading="Invoices">{invoices.map((i) => <CommandItem key={i.id} value={`invoice ${i.number}`} onSelect={() => go(`/invoices/${i.id}`)}><FileText /> <span className="num">{i.number}</span></CommandItem>)}</CommandGroup>}
          {payments.length > 0 && <CommandGroup heading="Payments">{payments.map((p) => <CommandItem key={p.id} value={`payment ${p.reference} ${dn(p.driverId)} ${p.amount}`} onSelect={() => go(`/payments`)}><Wallet /> <span className="num">{gbp(p.amount)}</span><span className="text-muted-foreground">{dn(p.driverId)} · {fmtDate(p.date)}</span></CommandItem>)}</CommandGroup>}
        </CommandList>
      </CommandDialog>
    </>
  );
}

function QuickAdd() {
  const open = useUI((s) => s.open);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button size="sm"><Plus /> <span className="hidden sm:inline">New</span></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>Create</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => open("booking")}><CalendarRange /> Booking</DropdownMenuItem>
        <DropdownMenuItem onClick={() => open("car")}><Car /> Car</DropdownMenuItem>
        <DropdownMenuItem onClick={() => open("driver")}><Users /> Driver</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => open("payment")}><Wallet /> Payment</DropdownMenuItem>
        <DropdownMenuItem onClick={() => open("expense")}><Receipt /> Expense</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function GlobalForms() {
  const { form, preset, close } = useUI();
  const oc = (o: boolean) => { if (!o) close(); };
  return (
    <>
      <CarForm open={form === "car"} onOpenChange={oc} />
      <DriverForm open={form === "driver"} onOpenChange={oc} />
      <BookingForm open={form === "booking"} onOpenChange={oc} presetCarId={preset.carId} presetDriverId={preset.driverId} />
      <PaymentForm open={form === "payment"} onOpenChange={oc} presetBookingId={preset.bookingId} />
      <ExpenseForm open={form === "expense"} onOpenChange={oc} presetCarId={preset.carId} />
    </>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
      <Skeleton className="h-72 rounded-xl" />
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const ready = useHydrateStore();
  const path = useRouterState({ select: (r) => r.location.pathname });
  const settings = useStore((s) => s.settings);
  const title = path === "/" ? "Dashboard" : (TITLES.find(([p]) => path.startsWith(p))?.[1] ?? "");
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <div className="no-print"><AppSidebar /></div>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="no-print sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur md:px-6">
            <SidebarTrigger />
            <div className="hidden h-5 w-px bg-border md:block" />
            <p className="hidden text-sm font-semibold md:block">{title}</p>
            <div className="ml-auto flex flex-1 items-center justify-end gap-2">
              <GlobalSearch />
              <Notifications />
              <QuickAdd />
              <Link to="/settings" className="hidden h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground sm:flex" aria-label="Profile">{initials(settings.userName || settings.businessName)}</Link>
            </div>
          </header>
          <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 md:px-8 md:py-8 animate-in fade-in duration-300">{ready ? children : <LoadingSkeleton />}</main>
        </div>
      </div>
      {ready && <GlobalForms />}
    </SidebarProvider>
  );
}
