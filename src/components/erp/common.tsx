import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action, compact }: { icon: LucideIcon; title: string; description?: string; action?: ReactNode; compact?: boolean }) {
  return (
    <div className={cn("relative flex flex-col items-center justify-center overflow-hidden text-center", compact ? "px-6 py-10" : "px-6 py-16")}>
      <div className="dot-grid pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <div className="relative mb-4 flex h-12 w-12 items-center justify-center rounded-xl border bg-card shadow-[var(--shadow-card)]">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <h3 className="relative text-sm font-semibold text-foreground">{title}</h3>
      {description && <p className="relative mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="relative mt-5">{action}</div>}
    </div>
  );
}

export function Panel({ title, action, children, className }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("surface overflow-hidden", className)}>
      {title && (
        <div className="flex items-center justify-between border-b px-5 py-3.5">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatCard({ label, value, icon: Icon, hint, tone = "default" }: { label: string; value: string; icon: LucideIcon; hint?: string; tone?: "default" | "success" | "warning" | "destructive" }) {
  const toneCls = { default: "text-primary bg-accent", success: "text-success bg-success/10", warning: "text-warning bg-warning/15", destructive: "text-destructive bg-destructive/10" }[tone];
  return (
    <div className="surface group p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", toneCls)}><Icon className="h-4 w-4" /></span>
      </div>
      <p className="num mt-3 text-2xl font-semibold text-foreground">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

const STATUS: Record<string, { label: string; cls: string }> = {
  available: { label: "Available", cls: "bg-success/10 text-success border-success/20" },
  booked: { label: "Booked", cls: "bg-info/10 text-info border-info/20" },
  on_rent: { label: "On Rent", cls: "bg-primary/10 text-primary border-primary/20" },
  maintenance: { label: "Maintenance", cls: "bg-warning/15 text-warning border-warning/30" },
  inactive: { label: "Inactive", cls: "bg-muted text-muted-foreground border-border" },
  upcoming: { label: "Upcoming", cls: "bg-info/10 text-info border-info/20" },
  active: { label: "Active", cls: "bg-primary/10 text-primary border-primary/20" },
  completed: { label: "Completed", cls: "bg-success/10 text-success border-success/20" },
  cancelled: { label: "Cancelled", cls: "bg-muted text-muted-foreground border-border" },
  overdue: { label: "Overdue", cls: "bg-destructive/10 text-destructive border-destructive/20" },
  draft: { label: "Draft", cls: "bg-muted text-muted-foreground border-border" },
  issued: { label: "Issued", cls: "bg-info/10 text-info border-info/20" },
  partially_paid: { label: "Partially Paid", cls: "bg-warning/15 text-warning border-warning/30" },
  paid: { label: "Paid", cls: "bg-success/10 text-success border-success/20" },
};

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status] ?? { label: status, cls: "" };
  return (
    <Badge variant="outline" className={cn("gap-1.5 rounded-full font-medium", s.cls)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {s.label}
    </Badge>
  );
}

export function Field({ label, children, hint, error }: { label: string; children: ReactNode; hint?: string; error?: string }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-foreground">{label}</span>
      {children}
      {error ? <span className="block text-xs text-destructive">{error}</span> : hint ? <span className="block text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

export function KV({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 text-sm">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-right font-medium text-foreground">{v}</span>
    </div>
  );
}

export function TableWrap({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto">{children}</div>;
}
