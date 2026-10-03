import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CarStatusManual = "available" | "maintenance" | "inactive";
export type CarStatus = "available" | "booked" | "on_rent" | "maintenance" | "inactive";
export type BookingStatusStored = "upcoming" | "active" | "completed" | "cancelled";
export type BookingStatus = BookingStatusStored | "overdue";
export type InvoiceStatusStored = "draft" | "issued" | "cancelled";
export type InvoiceStatus = "draft" | "issued" | "partially_paid" | "paid" | "overdue" | "cancelled";
export type PaymentMethod = "Cash" | "Bank Transfer" | "Card" | "Other";
export const PAYMENT_METHODS: PaymentMethod[] = ["Cash", "Bank Transfer", "Card", "Other"];
export const EXPENSE_CATEGORIES = ["Repair", "Service", "Tyres", "MOT", "Insurance", "Cleaning", "Fuel", "Parts", "Other"] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export interface Car {
  id: string; registration: string; make: string; model: string; year: number; mileage: number;
  color: string; status: CarStatusManual; notes: string;
  purchaseDate?: string; purchasePrice?: number; insuranceExpiry?: string; motExpiry?: string;
  createdAt: string;
}
export interface Driver {
  id: string; fullName: string; phone: string; email: string; address: string;
  licenceNumber: string; licenceExpiry: string; dob?: string; notes: string; createdAt: string;
}
export interface Booking {
  id: string; ref: string; driverId: string; carId: string;
  pickupDate: string; pickupTime: string; returnDate: string; returnTime: string;
  dailyRate: number; days: number; additionalCharges: number; discount: number; total: number;
  status: BookingStatusStored; notes: string; createdAt: string;
}
export interface Invoice {
  id: string; number: string; bookingId: string; issueDate: string; dueDate: string;
  status: InvoiceStatusStored; createdAt: string;
}
export interface Payment {
  id: string; driverId: string; bookingId: string; invoiceId?: string; amount: number;
  date: string; method: PaymentMethod; reference: string; notes: string; createdAt: string;
}
export interface Expense {
  id: string; date: string; category: ExpenseCategory; amount: number; carId?: string;
  description: string; method: PaymentMethod; reference: string; notes: string; createdAt: string;
}
export interface Settings {
  businessName: string; address: string; phone: string; email: string; website: string; logo: string;
  currency: "GBP"; defaultDailyRate?: number; invoicePrefix: string; paymentTermsDays: number;
  userName: string;
}

interface State {
  cars: Car[]; drivers: Driver[]; bookings: Booking[]; invoices: Invoice[];
  payments: Payment[]; expenses: Expense[]; settings: Settings;
  bookingSeq: number; invoiceSeq: number;
  addCar: (c: Omit<Car, "id" | "createdAt">) => Car;
  updateCar: (id: string, c: Partial<Car>) => void;
  deleteCar: (id: string) => void;
  addDriver: (d: Omit<Driver, "id" | "createdAt">) => Driver;
  updateDriver: (id: string, d: Partial<Driver>) => void;
  deleteDriver: (id: string) => void;
  addBooking: (b: Omit<Booking, "id" | "createdAt" | "ref">) => Booking;
  updateBooking: (id: string, b: Partial<Booking>) => void;
  deleteBooking: (id: string) => void;
  addInvoice: (bookingId: string, opts?: { draft?: boolean }) => Invoice;
  updateInvoice: (id: string, i: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  addPayment: (p: Omit<Payment, "id" | "createdAt">) => Payment;
  deletePayment: (id: string) => void;
  addExpense: (e: Omit<Expense, "id" | "createdAt">) => Expense;
  updateExpense: (id: string, e: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  updateSettings: (s: Partial<Settings>) => void;
}

const uid = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2));
const now = () => new Date().toISOString();
export const todayISO = () => new Date().toISOString().slice(0, 10);
const addDays = (iso: string, n: number) => { const d = new Date(iso); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      cars: [], drivers: [], bookings: [], invoices: [], payments: [], expenses: [],
      bookingSeq: 0, invoiceSeq: 0,
      settings: {
        businessName: "", address: "", phone: "", email: "", website: "", logo: "",
        currency: "GBP", invoicePrefix: "INV-", paymentTermsDays: 7, userName: "",
      },
      addCar: (c) => { const car = { ...c, id: uid(), createdAt: now() }; set((s) => ({ cars: [car, ...s.cars] })); return car; },
      updateCar: (id, c) => set((s) => ({ cars: s.cars.map((x) => (x.id === id ? { ...x, ...c } : x)) })),
      deleteCar: (id) => set((s) => ({ cars: s.cars.filter((x) => x.id !== id), expenses: s.expenses.map((e) => (e.carId === id ? { ...e, carId: undefined } : e)) })),
      addDriver: (d) => { const dr = { ...d, id: uid(), createdAt: now() }; set((s) => ({ drivers: [dr, ...s.drivers] })); return dr; },
      updateDriver: (id, d) => set((s) => ({ drivers: s.drivers.map((x) => (x.id === id ? { ...x, ...d } : x)) })),
      deleteDriver: (id) => set((s) => ({ drivers: s.drivers.filter((x) => x.id !== id) })),
      addBooking: (b) => {
        const seq = get().bookingSeq + 1;
        const bk = { ...b, id: uid(), ref: `BK-${String(seq).padStart(4, "0")}`, createdAt: now() };
        set((s) => ({ bookings: [bk, ...s.bookings], bookingSeq: seq })); return bk;
      },
      updateBooking: (id, b) => set((s) => ({ bookings: s.bookings.map((x) => (x.id === id ? { ...x, ...b } : x)) })),
      deleteBooking: (id) => set((s) => ({
        bookings: s.bookings.filter((x) => x.id !== id),
        invoices: s.invoices.filter((i) => i.bookingId !== id),
        payments: s.payments.filter((p) => p.bookingId !== id),
      })),
      addInvoice: (bookingId, opts) => {
        const existing = get().invoices.find((i) => i.bookingId === bookingId && i.status !== "cancelled");
        if (existing) return existing;
        const { invoiceSeq, settings } = get();
        const seq = invoiceSeq + 1;
        const issue = todayISO();
        const inv: Invoice = {
          id: uid(), number: `${settings.invoicePrefix}${String(seq).padStart(4, "0")}`, bookingId,
          issueDate: issue, dueDate: addDays(issue, settings.paymentTermsDays || 0),
          status: opts?.draft ? "draft" : "issued", createdAt: now(),
        };
        set((s) => ({
          invoices: [inv, ...s.invoices], invoiceSeq: seq,
          payments: s.payments.map((p) => (p.bookingId === bookingId && !p.invoiceId ? { ...p, invoiceId: inv.id } : p)),
        }));
        return inv;
      },
      updateInvoice: (id, i) => set((s) => ({ invoices: s.invoices.map((x) => (x.id === id ? { ...x, ...i } : x)) })),
      deleteInvoice: (id) => set((s) => ({ invoices: s.invoices.filter((x) => x.id !== id), payments: s.payments.map((p) => (p.invoiceId === id ? { ...p, invoiceId: undefined } : p)) })),
      addPayment: (p) => {
        const inv = get().invoices.find((i) => i.bookingId === p.bookingId && i.status !== "cancelled");
        const pay = { ...p, invoiceId: p.invoiceId ?? inv?.id, id: uid(), createdAt: now() };
        set((s) => ({ payments: [pay, ...s.payments] })); return pay;
      },
      deletePayment: (id) => set((s) => ({ payments: s.payments.filter((x) => x.id !== id) })),
      addExpense: (e) => { const ex = { ...e, id: uid(), createdAt: now() }; set((s) => ({ expenses: [ex, ...s.expenses] })); return ex; },
      updateExpense: (id, e) => set((s) => ({ expenses: s.expenses.map((x) => (x.id === id ? { ...x, ...e } : x)) })),
      deleteExpense: (id) => set((s) => ({ expenses: s.expenses.filter((x) => x.id !== id) })),
      updateSettings: (st) => set((s) => ({ settings: { ...s.settings, ...st } })),
    }),
    { name: "fleetledger-erp-v1", skipHydration: true },
  ),
);
