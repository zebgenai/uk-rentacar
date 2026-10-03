import type { Booking, BookingStatus, Car, CarStatus, Invoice, InvoiceStatus, Payment, Expense } from "./store";
import { useStore } from "./store";
import { useEffect, useState } from "react";

export const gbp = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2 }).format(n || 0);
export const gbp0 = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n || 0);
export const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const dt = (d: string, t: string) => new Date(`${d}T${t || "00:00"}`);

export function rentalDays(pd: string, pt: string, rd: string, rt: string) {
  if (!pd || !rd) return 0;
  const ms = dt(rd, rt).getTime() - dt(pd, pt).getTime();
  if (ms <= 0) return 0;
  return Math.max(1, Math.ceil(ms / 86400000));
}

export function bookingStatus(b: Booking, at = new Date()): BookingStatus {
  if (b.status === "active" && dt(b.returnDate, b.returnTime) < at) return "overdue";
  return b.status;
}

export function overlaps(a: Pick<Booking, "pickupDate" | "pickupTime" | "returnDate" | "returnTime">, b: Booking) {
  return dt(a.pickupDate, a.pickupTime) < dt(b.returnDate, b.returnTime) && dt(b.pickupDate, b.pickupTime) < dt(a.returnDate, a.returnTime);
}

export function findConflict(bookings: Booking[], carId: string, range: Pick<Booking, "pickupDate" | "pickupTime" | "returnDate" | "returnTime">, ignoreId?: string) {
  return bookings.find((b) => b.carId === carId && b.id !== ignoreId && (b.status === "upcoming" || b.status === "active") && overlaps(range, b));
}

export function carStatus(car: Car, bookings: Booking[]): CarStatus {
  if (car.status === "maintenance" || car.status === "inactive") return car.status;
  const mine = bookings.filter((b) => b.carId === car.id);
  if (mine.some((b) => b.status === "active")) return "on_rent";
  if (mine.some((b) => b.status === "upcoming")) return "booked";
  return "available";
}

export const paidForBooking = (bookingId: string, payments: Payment[]) =>
  payments.filter((p) => p.bookingId === bookingId).reduce((s, p) => s + p.amount, 0);

export function invoiceStatus(inv: Invoice, total: number, paid: number): InvoiceStatus {
  if (inv.status === "cancelled") return "cancelled";
  if (inv.status === "draft") return "draft";
  if (total > 0 && paid >= total) return "paid";
  if (new Date(inv.dueDate) < new Date(new Date().toDateString())) return "overdue";
  if (paid > 0) return "partially_paid";
  return "issued";
}

export const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

export function carFinancials(carId: string, bookings: Booking[], payments: Payment[], expenses: Expense[]) {
  const bIds = new Set(bookings.filter((b) => b.carId === carId).map((b) => b.id));
  const revenue = sum(payments.filter((p) => bIds.has(p.bookingId)).map((p) => p.amount));
  const exp = sum(expenses.filter((e) => e.carId === carId).map((e) => e.amount));
  const rentalDays = sum(bookings.filter((b) => b.carId === carId && b.status !== "cancelled").map((b) => b.days));
  return { revenue, expenses: exp, profit: revenue - exp, rentalDays };
}

export function outstandingTotal(bookings: Booking[], payments: Payment[]) {
  return sum(bookings.filter((b) => b.status !== "cancelled").map((b) => Math.max(0, b.total - paidForBooking(b.id, payments))));
}

/** Rehydrate persisted store on the client after first render (SSR-safe). */
export function useHydrateStore() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    Promise.resolve(useStore.persist.rehydrate()).then(() => setReady(true));
  }, []);
  return ready;
}

export type Range = "today" | "week" | "month" | "last_month" | "year" | "all" | "custom";
export function rangeBounds(r: Range, from?: string, to?: string): [Date, Date] {
  const n = new Date(); const start = new Date(n.toDateString()); const end = new Date(start); end.setDate(end.getDate() + 1);
  switch (r) {
    case "today": return [start, end];
    case "week": { const s = new Date(start); s.setDate(s.getDate() - ((s.getDay() + 6) % 7)); return [s, end]; }
    case "month": return [new Date(n.getFullYear(), n.getMonth(), 1), end];
    case "last_month": return [new Date(n.getFullYear(), n.getMonth() - 1, 1), new Date(n.getFullYear(), n.getMonth(), 1)];
    case "year": return [new Date(n.getFullYear(), 0, 1), end];
    case "custom": { const e = to ? new Date(to) : end; if (to) e.setDate(e.getDate() + 1); return [from ? new Date(from) : new Date(0), e]; }
    default: return [new Date(0), new Date(8640000000000000)];
  }
}
export const inRange = (iso: string, [a, b]: [Date, Date]) => { const d = new Date(iso); return d >= a && d < b; };
