import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "./common";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, todayISO, useStore, type Car, type Driver, type ExpenseCategory, type PaymentMethod } from "@/lib/store";
import { findConflict, gbp, paidForBooking, rentalDays } from "@/lib/calc";
import { cn } from "@/lib/utils";

function FormSheet({ open, onOpenChange, title, description, children, onSubmit, submitLabel }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; description?: string; children: ReactNode; onSubmit: () => void; submitLabel: string }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="border-b px-6 py-5">
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <form id="erp-form" className="flex-1 space-y-4 overflow-y-auto px-6 py-5" onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
          {children}
        </form>
        <SheetFooter className="border-t px-6 py-4 sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" form="erp-form">{submitLabel}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

const Grid = ({ children }: { children: ReactNode }) => <div className="grid grid-cols-2 gap-4">{children}</div>;
const num = (v: string) => (v === "" ? 0 : Number(v));

/* ---------------- CAR ---------------- */
export function CarForm({ open, onOpenChange, car }: { open: boolean; onOpenChange: (o: boolean) => void; car?: Car }) {
  const { addCar, updateCar, cars } = useStore();
  const init = () => ({
    registration: car?.registration ?? "", make: car?.make ?? "", model: car?.model ?? "", year: car ? String(car.year) : "",
    mileage: car ? String(car.mileage) : "", color: car?.color ?? "", status: car?.status ?? "available", notes: car?.notes ?? "",
    purchaseDate: car?.purchaseDate ?? "", purchasePrice: car?.purchasePrice != null ? String(car.purchasePrice) : "",
    insuranceExpiry: car?.insuranceExpiry ?? "", motExpiry: car?.motExpiry ?? "",
  });
  const [f, setF] = useState(init);
  const [err, setErr] = useState<Record<string, string>>({});
  const [lastOpen, setLastOpen] = useState(open);
  if (open !== lastOpen) { setLastOpen(open); if (open) { setF(init()); setErr({}); } }
  const s = (k: keyof ReturnType<typeof init>) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  const submit = () => {
    const e: Record<string, string> = {};
    const reg = f.registration.trim().toUpperCase();
    if (!reg) e.registration = "Registration is required";
    else if (cars.some((c) => c.registration.toUpperCase() === reg && c.id !== car?.id)) e.registration = "This registration already exists";
    if (!f.make.trim()) e.make = "Required";
    if (!f.model.trim()) e.model = "Required";
    const y = Number(f.year); if (!y || y < 1950 || y > new Date().getFullYear() + 1) e.year = "Enter a valid year";
    setErr(e); if (Object.keys(e).length) return;
    const data = {
      registration: reg, make: f.make.trim(), model: f.model.trim(), year: y, mileage: num(f.mileage), color: f.color.trim(),
      status: f.status as Car["status"], notes: f.notes, purchaseDate: f.purchaseDate || undefined,
      purchasePrice: f.purchasePrice ? Number(f.purchasePrice) : undefined, insuranceExpiry: f.insuranceExpiry || undefined, motExpiry: f.motExpiry || undefined,
    };
    if (car) { updateCar(car.id, data); toast.success("Vehicle updated"); } else { addCar(data); toast.success(`${reg} added to your fleet`); }
    onOpenChange(false);
  };

  return (
    <FormSheet open={open} onOpenChange={onOpenChange} title={car ? "Edit vehicle" : "Add vehicle"} description="Vehicle details for your fleet register." onSubmit={submit} submitLabel={car ? "Save changes" : "Add vehicle"}>
      <Field label="Registration number" error={err.registration}><Input className="num uppercase" placeholder="e.g. AB12 CDE" value={f.registration} onChange={s("registration")} /></Field>
      <Grid>
        <Field label="Make" error={err.make}><Input value={f.make} onChange={s("make")} /></Field>
        <Field label="Model" error={err.model}><Input value={f.model} onChange={s("model")} /></Field>
        <Field label="Year" error={err.year}><Input type="number" value={f.year} onChange={s("year")} /></Field>
        <Field label="Mileage"><Input type="number" min={0} value={f.mileage} onChange={s("mileage")} /></Field>
        <Field label="Colour"><Input value={f.color} onChange={s("color")} /></Field>
        <Field label="Status" hint="Booked / On Rent are set automatically">
          <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v as Car["status"] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="available">Available</SelectItem><SelectItem value="maintenance">Maintenance</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent>
          </Select>
        </Field>
      </Grid>
      <div className="rounded-lg border bg-muted/40 p-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Optional</p>
        <Grid>
          <Field label="Purchase date"><Input type="date" value={f.purchaseDate} onChange={s("purchaseDate")} /></Field>
          <Field label="Purchase price (£)"><Input type="number" min={0} step="0.01" value={f.purchasePrice} onChange={s("purchasePrice")} /></Field>
          <Field label="Insurance expiry"><Input type="date" value={f.insuranceExpiry} onChange={s("insuranceExpiry")} /></Field>
          <Field label="MOT expiry"><Input type="date" value={f.motExpiry} onChange={s("motExpiry")} /></Field>
        </Grid>
      </div>
      <Field label="Notes"><Textarea rows={3} value={f.notes} onChange={s("notes")} /></Field>
    </FormSheet>
  );
}

/* ---------------- DRIVER ---------------- */
export function DriverForm({ open, onOpenChange, driver }: { open: boolean; onOpenChange: (o: boolean) => void; driver?: Driver }) {
  const { addDriver, updateDriver } = useStore();
  const init = () => ({
    fullName: driver?.fullName ?? "", phone: driver?.phone ?? "", email: driver?.email ?? "", address: driver?.address ?? "",
    licenceNumber: driver?.licenceNumber ?? "", licenceExpiry: driver?.licenceExpiry ?? "", dob: driver?.dob ?? "", notes: driver?.notes ?? "",
  });
  const [f, setF] = useState(init);
  const [err, setErr] = useState<Record<string, string>>({});
  const [lastOpen, setLastOpen] = useState(open);
  if (open !== lastOpen) { setLastOpen(open); if (open) { setF(init()); setErr({}); } }
  const s = (k: keyof ReturnType<typeof init>) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  const submit = () => {
    const e: Record<string, string> = {};
    if (!f.fullName.trim()) e.fullName = "Full name is required";
    if (!f.phone.trim()) e.phone = "Phone is required";
    if (f.email && !/^\S+@\S+\.\S+$/.test(f.email)) e.email = "Enter a valid email";
    if (!f.licenceNumber.trim()) e.licenceNumber = "Licence number is required";
    if (!f.licenceExpiry) e.licenceExpiry = "Licence expiry is required";
    setErr(e); if (Object.keys(e).length) return;
    const data = { ...f, fullName: f.fullName.trim(), licenceNumber: f.licenceNumber.trim().toUpperCase(), dob: f.dob || undefined };
    if (driver) { updateDriver(driver.id, data); toast.success("Driver updated"); } else { addDriver(data); toast.success(`${data.fullName} added`); }
    onOpenChange(false);
  };

  return (
    <FormSheet open={open} onOpenChange={onOpenChange} title={driver ? "Edit driver" : "Add driver"} description="Personal and licence details." onSubmit={submit} submitLabel={driver ? "Save changes" : "Add driver"}>
      <Field label="Full name" error={err.fullName}><Input value={f.fullName} onChange={s("fullName")} /></Field>
      <Grid>
        <Field label="Phone" error={err.phone}><Input type="tel" value={f.phone} onChange={s("phone")} /></Field>
        <Field label="Email" error={err.email}><Input type="email" value={f.email} onChange={s("email")} /></Field>
      </Grid>
      <Field label="Address"><Textarea rows={2} value={f.address} onChange={s("address")} /></Field>
      <Grid>
        <Field label="Driving licence number" error={err.licenceNumber}><Input className="num uppercase" value={f.licenceNumber} onChange={s("licenceNumber")} /></Field>
        <Field label="Licence expiry" error={err.licenceExpiry}><Input type="date" value={f.licenceExpiry} onChange={s("licenceExpiry")} /></Field>
        <Field label="Date of birth (optional)"><Input type="date" value={f.dob} onChange={s("dob")} /></Field>
      </Grid>
      <Field label="Notes"><Textarea rows={3} value={f.notes} onChange={s("notes")} /></Field>
    </FormSheet>
  );
}

/* ---------------- BOOKING ---------------- */
export function BookingForm({ open, onOpenChange, presetCarId, presetDriverId }: { open: boolean; onOpenChange: (o: boolean) => void; presetCarId?: string; presetDriverId?: string }) {
  const { cars, drivers, bookings, addBooking, settings } = useStore();
  const init = () => ({
    driverId: presetDriverId ?? "", carId: presetCarId ?? "", pickupDate: todayISO(), pickupTime: "10:00", returnDate: "", returnTime: "10:00",
    dailyRate: settings.defaultDailyRate ? String(settings.defaultDailyRate) : "", additional: "", discount: "", notes: "",
  });
  const [f, setF] = useState(init);
  const [err, setErr] = useState<Record<string, string>>({});
  const [lastOpen, setLastOpen] = useState(open);
  if (open !== lastOpen) { setLastOpen(open); if (open) { setF(init()); setErr({}); } }
  const s = (k: keyof ReturnType<typeof init>) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  const days = rentalDays(f.pickupDate, f.pickupTime, f.returnDate, f.returnTime);
  const subtotal = num(f.dailyRate) * days;
  const total = Math.max(0, subtotal + num(f.additional) - num(f.discount));
  const conflict = useMemo(() => (f.carId && days > 0 ? findConflict(bookings, f.carId, f) : undefined), [bookings, f, days]);
  const usableCars = cars.filter((c) => c.status !== "inactive");

  const submit = () => {
    const e: Record<string, string> = {};
    if (!f.driverId) e.driverId = "Select a driver";
    if (!f.carId) e.carId = "Select a car";
    if (!f.returnDate) e.returnDate = "Return date is required";
    else if (days <= 0) e.returnDate = "Return must be after pickup";
    if (!num(f.dailyRate)) e.dailyRate = "Enter a daily rate";
    if (num(f.discount) > subtotal + num(f.additional)) e.discount = "Discount exceeds charges";
    if (conflict) e.carId = `Already booked (${conflict.ref}) for overlapping dates`;
    const car = cars.find((c) => c.id === f.carId);
    if (car?.status === "maintenance") e.carId = "This car is in maintenance";
    setErr(e); if (Object.keys(e).length) return;
    const start = new Date(`${f.pickupDate}T${f.pickupTime}`);
    const b = addBooking({
      driverId: f.driverId, carId: f.carId, pickupDate: f.pickupDate, pickupTime: f.pickupTime, returnDate: f.returnDate, returnTime: f.returnTime,
      dailyRate: num(f.dailyRate), days, additionalCharges: num(f.additional), discount: num(f.discount), total,
      status: start <= new Date() ? "active" : "upcoming", notes: f.notes,
    });
    toast.success(`Booking ${b.ref} created`, { description: `Total ${gbp(total)}` });
    onOpenChange(false);
  };

  const Step = ({ n, t }: { n: number; t: string }) => (
    <div className="flex items-center gap-2 pt-1">
      <span className="num flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">{n}</span>
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t}</span>
    </div>
  );

  return (
    <FormSheet open={open} onOpenChange={onOpenChange} title="New booking" description="Driver, vehicle, dates and pricing." onSubmit={submit} submitLabel="Create booking">
      <Step n={1} t="Driver" />
      <Field label="Driver" error={err.driverId}>
        <Select value={f.driverId} onValueChange={(v) => setF({ ...f, driverId: v })}>
          <SelectTrigger><SelectValue placeholder={drivers.length ? "Select driver" : "No drivers yet — add one first"} /></SelectTrigger>
          <SelectContent>{drivers.map((d) => <SelectItem key={d.id} value={d.id}>{d.fullName}</SelectItem>)}</SelectContent>
        </Select>
      </Field>
      <Step n={2} t="Vehicle" />
      <Field label="Car" error={err.carId}>
        <Select value={f.carId} onValueChange={(v) => setF({ ...f, carId: v })}>
          <SelectTrigger><SelectValue placeholder={usableCars.length ? "Select car" : "No cars yet — add one first"} /></SelectTrigger>
          <SelectContent>{usableCars.map((c) => <SelectItem key={c.id} value={c.id}>{c.registration} · {c.make} {c.model}</SelectItem>)}</SelectContent>
        </Select>
      </Field>
      <Step n={3} t="Rental dates" />
      <Grid>
        <Field label="Pickup date"><Input type="date" value={f.pickupDate} onChange={s("pickupDate")} /></Field>
        <Field label="Pickup time"><Input type="time" value={f.pickupTime} onChange={s("pickupTime")} /></Field>
        <Field label="Return date" error={err.returnDate}><Input type="date" value={f.returnDate} onChange={s("returnDate")} /></Field>
        <Field label="Return time"><Input type="time" value={f.returnTime} onChange={s("returnTime")} /></Field>
      </Grid>
      {conflict && (
        <div className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" /> This car is already booked under {conflict.ref} during the selected period. Choose different dates or another car.
        </div>
      )}
      <Step n={4} t="Pricing" />
      <Grid>
        <Field label="Daily rate (£)" error={err.dailyRate}><Input type="number" min={0} step="0.01" value={f.dailyRate} onChange={s("dailyRate")} /></Field>
        <Field label="Rental days"><Input readOnly value={days} className="num bg-muted" /></Field>
        <Field label="Additional charges (£)"><Input type="number" min={0} step="0.01" value={f.additional} onChange={s("additional")} /></Field>
        <Field label="Discount (£)" error={err.discount}><Input type="number" min={0} step="0.01" value={f.discount} onChange={s("discount")} /></Field>
      </Grid>
      <div className="rounded-lg bg-primary p-4 text-primary-foreground">
        <div className="flex justify-between text-xs opacity-75"><span>{gbp(num(f.dailyRate))} × {days} day{days === 1 ? "" : "s"}</span><span className="num">{gbp(subtotal)}</span></div>
        {num(f.additional) > 0 && <div className="mt-1 flex justify-between text-xs opacity-75"><span>Additional</span><span className="num">+{gbp(num(f.additional))}</span></div>}
        {num(f.discount) > 0 && <div className="mt-1 flex justify-between text-xs opacity-75"><span>Discount</span><span className="num">−{gbp(num(f.discount))}</span></div>}
        <div className="mt-3 flex items-end justify-between border-t border-primary-foreground/15 pt-3"><span className="text-sm">Total</span><span className="num text-xl font-semibold">{gbp(total)}</span></div>
      </div>
      <Field label="Notes"><Textarea rows={2} value={f.notes} onChange={s("notes")} /></Field>
    </FormSheet>
  );
}

/* ---------------- PAYMENT ---------------- */
export function PaymentForm({ open, onOpenChange, presetBookingId }: { open: boolean; onOpenChange: (o: boolean) => void; presetBookingId?: string }) {
  const { bookings, drivers, payments, cars, addPayment, invoices } = useStore();
  const init = () => ({ bookingId: presetBookingId ?? "", amount: "", date: todayISO(), method: "Bank Transfer" as PaymentMethod, reference: "", notes: "" });
  const [f, setF] = useState(init);
  const [err, setErr] = useState<Record<string, string>>({});
  const [lastOpen, setLastOpen] = useState(open);
  if (open !== lastOpen) { setLastOpen(open); if (open) { setF(init()); setErr({}); } }
  const s = (k: keyof ReturnType<typeof init>) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const open_ = bookings.filter((b) => b.status !== "cancelled");
  const b = bookings.find((x) => x.id === f.bookingId);
  const balance = b ? Math.max(0, b.total - paidForBooking(b.id, payments)) : 0;
  const inv = b && invoices.find((i) => i.bookingId === b.id && i.status !== "cancelled");

  const submit = () => {
    const e: Record<string, string> = {};
    if (!b) e.bookingId = "Select a booking";
    const a = num(f.amount); if (!(a > 0)) e.amount = "Enter an amount";
    else if (b && a > balance + 0.001) e.amount = `Exceeds outstanding balance of ${gbp(balance)}`;
    setErr(e); if (Object.keys(e).length || !b) return;
    addPayment({ bookingId: b.id, driverId: b.driverId, amount: a, date: f.date, method: f.method, reference: f.reference, notes: f.notes });
    toast.success(`Payment of ${gbp(a)} recorded`, { description: balance - a <= 0 ? "Booking fully paid" : `Remaining ${gbp(balance - a)}` });
    onOpenChange(false);
  };

  return (
    <FormSheet open={open} onOpenChange={onOpenChange} title="Record payment" description="Money received from a driver." onSubmit={submit} submitLabel="Record payment">
      <Field label="Booking" error={err.bookingId}>
        <Select value={f.bookingId} onValueChange={(v) => setF({ ...f, bookingId: v })}>
          <SelectTrigger><SelectValue placeholder={open_.length ? "Select booking" : "No bookings yet"} /></SelectTrigger>
          <SelectContent>
            {open_.map((x) => {
              const d = drivers.find((d) => d.id === x.driverId); const c = cars.find((c) => c.id === x.carId);
              return <SelectItem key={x.id} value={x.id}>{x.ref} · {d?.fullName ?? "—"} · {c?.registration ?? "—"}</SelectItem>;
            })}
          </SelectContent>
        </Select>
      </Field>
      {b && (
        <div className="grid grid-cols-3 gap-2 rounded-lg border bg-muted/40 p-3 text-xs">
          <div><p className="text-muted-foreground">Total</p><p className="num font-medium">{gbp(b.total)}</p></div>
          <div><p className="text-muted-foreground">Paid</p><p className="num font-medium">{gbp(b.total - balance)}</p></div>
          <div><p className="text-muted-foreground">Outstanding</p><p className={cn("num font-semibold", balance > 0 ? "text-destructive" : "text-success")}>{gbp(balance)}</p></div>
          <p className="col-span-3 text-muted-foreground">Invoice: {inv ? inv.number : "not generated yet — will link automatically when generated"}</p>
        </div>
      )}
      <Grid>
        <Field label="Amount (£)" error={err.amount}><Input type="number" min={0} step="0.01" value={f.amount} onChange={s("amount")} /></Field>
        <Field label="Payment date"><Input type="date" value={f.date} onChange={s("date")} /></Field>
        <Field label="Method">
          <Select value={f.method} onValueChange={(v) => setF({ ...f, method: v as PaymentMethod })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Reference"><Input value={f.reference} onChange={s("reference")} /></Field>
      </Grid>
      <Field label="Notes"><Textarea rows={2} value={f.notes} onChange={s("notes")} /></Field>
    </FormSheet>
  );
}

/* ---------------- EXPENSE ---------------- */
export function ExpenseForm({ open, onOpenChange, presetCarId }: { open: boolean; onOpenChange: (o: boolean) => void; presetCarId?: string }) {
  const { cars, addExpense } = useStore();
  const init = () => ({ date: todayISO(), category: "Service" as ExpenseCategory, amount: "", carId: presetCarId ?? "none", description: "", method: "Card" as PaymentMethod, reference: "", notes: "" });
  const [f, setF] = useState(init);
  const [err, setErr] = useState<Record<string, string>>({});
  const [lastOpen, setLastOpen] = useState(open);
  if (open !== lastOpen) { setLastOpen(open); if (open) { setF(init()); setErr({}); } }
  const s = (k: keyof ReturnType<typeof init>) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  const submit = () => {
    const e: Record<string, string> = {};
    if (!(num(f.amount) > 0)) e.amount = "Enter an amount";
    if (!f.description.trim()) e.description = "Add a short description";
    setErr(e); if (Object.keys(e).length) return;
    addExpense({ date: f.date, category: f.category, amount: num(f.amount), carId: f.carId === "none" ? undefined : f.carId, description: f.description.trim(), method: f.method, reference: f.reference, notes: f.notes });
    toast.success(`Expense of ${gbp(num(f.amount))} recorded`);
    onOpenChange(false);
  };

  return (
    <FormSheet open={open} onOpenChange={onOpenChange} title="Add expense" description="Vehicle or general business cost." onSubmit={submit} submitLabel="Add expense">
      <Grid>
        <Field label="Expense date"><Input type="date" value={f.date} onChange={s("date")} /></Field>
        <Field label="Amount (£)" error={err.amount}><Input type="number" min={0} step="0.01" value={f.amount} onChange={s("amount")} /></Field>
        <Field label="Category">
          <Select value={f.category} onValueChange={(v) => setF({ ...f, category: v as ExpenseCategory })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{EXPENSE_CATEGORIES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Car (optional)">
          <Select value={f.carId} onValueChange={(v) => setF({ ...f, carId: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">General business expense</SelectItem>
              {cars.map((c) => <SelectItem key={c.id} value={c.id}>{c.registration} · {c.make} {c.model}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
      </Grid>
      <Field label="Description" error={err.description}><Input value={f.description} onChange={s("description")} /></Field>
      <Grid>
        <Field label="Payment method">
          <Select value={f.method} onValueChange={(v) => setF({ ...f, method: v as PaymentMethod })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Reference"><Input value={f.reference} onChange={s("reference")} /></Field>
      </Grid>
      <Field label="Notes"><Textarea rows={2} value={f.notes} onChange={s("notes")} /></Field>
    </FormSheet>
  );
}
