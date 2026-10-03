import { create } from "zustand";

export type FormKind = "car" | "driver" | "booking" | "payment" | "expense" | null;
interface UI {
  form: FormKind;
  preset: { carId?: string; driverId?: string; bookingId?: string };
  open: (k: Exclude<FormKind, null>, preset?: UI["preset"]) => void;
  close: () => void;
}
export const useUI = create<UI>((set) => ({
  form: null,
  preset: {},
  open: (form, preset = {}) => set({ form, preset }),
  close: () => set({ form: null }),
}));
