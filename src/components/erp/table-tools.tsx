import { useState, type ReactNode } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative w-full sm:w-72">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="pl-9" />
    </div>
  );
}

export function FilterPills<T extends string>({ options, value, onChange }: { options: { v: T; l: string; n?: number }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-1 rounded-lg border bg-muted/50 p-1">
      {options.map((o) => (
        <button key={o.v} onClick={() => onChange(o.v)} className={cn("rounded-md px-3 py-1.5 text-xs font-medium transition-all", value === o.v ? "bg-card text-foreground shadow-[var(--shadow-card)]" : "text-muted-foreground hover:text-foreground")}>
          {o.l}{o.n != null && <span className="num ml-1.5 text-muted-foreground">{o.n}</span>}
        </button>
      ))}
    </div>
  );
}

export function usePaged<T>(items: T[], size = 12) {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(items.length / size));
  const p = Math.min(page, pages - 1);
  const slice = items.slice(p * size, p * size + size);
  const controls = pages > 1 ? (
    <div className="flex items-center justify-between border-t px-5 py-3 text-xs text-muted-foreground">
      <span className="num">{p * size + 1}–{Math.min(items.length, (p + 1) * size)} of {items.length}</span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={p === 0} onClick={() => setPage(p - 1)}>Previous</Button>
        <Button variant="outline" size="sm" disabled={p >= pages - 1} onClick={() => setPage(p + 1)}>Next</Button>
      </div>
    </div>
  ) : null;
  return { slice, controls };
}

export function Confirm({ trigger, title, description, onConfirm, label = "Delete" }: { trigger: ReactNode; title: string; description: string; onConfirm: () => void; label?: string }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>{title}</AlertDialogTitle><AlertDialogDescription>{description}</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={onConfirm}>{label}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export const th = "h-10 px-5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground whitespace-nowrap";
export const td = "px-5 py-3.5 text-sm whitespace-nowrap";
export const tr = "border-t transition-colors hover:bg-muted/40";
