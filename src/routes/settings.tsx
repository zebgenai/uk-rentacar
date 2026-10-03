import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Building2, CreditCard, Upload, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PAYMENT_METHODS, useStore } from "@/lib/store";
import { Field, PageHeader, Panel } from "@/components/erp/common";
import { pageHead } from "@/lib/meta";

export const Route = createFileRoute("/settings")({
  head: pageHead("Settings", "Business information, invoice and rental settings."),
  component: SettingsPage,
});

function SettingsPage() {
  const { settings, updateSettings } = useStore();
  const [f, setF] = useState({ ...settings, defaultDailyRate: settings.defaultDailyRate != null ? String(settings.defaultDailyRate) : "", paymentTermsDays: String(settings.paymentTermsDays) });
  const s = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  const onLogo = (file?: File) => {
    if (!file) return;
    if (file.size > 500_000) { toast.error("Logo must be under 500 KB"); return; }
    const r = new FileReader(); r.onload = () => setF((p) => ({ ...p, logo: String(r.result) })); r.readAsDataURL(file);
  };
  const save = () => {
    if (f.email && !/^\S+@\S+\.\S+$/.test(f.email)) { toast.error("Enter a valid business email"); return; }
    if (!f.invoicePrefix.trim()) { toast.error("Invoice prefix is required"); return; }
    updateSettings({ ...f, defaultDailyRate: f.defaultDailyRate ? Number(f.defaultDailyRate) : undefined, paymentTermsDays: Number(f.paymentTermsDays) || 0, invoicePrefix: f.invoicePrefix.trim() });
    toast.success("Settings saved");
  };

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title="Settings" description="These details appear on your invoices." actions={<Button onClick={save}>Save changes</Button>} />
      <Panel title="Business Information">
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <div className="flex items-center gap-4 sm:col-span-2">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border bg-muted">{f.logo ? <img src={f.logo} alt="Logo" className="h-full w-full object-contain" /> : <Building2 className="h-6 w-6 text-muted-foreground" />}</div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild><label className="cursor-pointer"><Upload /> Upload logo<input type="file" accept="image/*" className="hidden" onChange={(e) => onLogo(e.target.files?.[0])} /></label></Button>
              {f.logo && <Button variant="ghost" size="sm" onClick={() => setF({ ...f, logo: "" })}>Remove</Button>}
            </div>
          </div>
          <Field label="Business name"><Input value={f.businessName} onChange={s("businessName")} /></Field>
          <Field label="Phone"><Input value={f.phone} onChange={s("phone")} /></Field>
          <Field label="Email"><Input type="email" value={f.email} onChange={s("email")} /></Field>
          <Field label="Website"><Input value={f.website} onChange={s("website")} /></Field>
          <div className="sm:col-span-2"><Field label="Business address"><Textarea rows={3} value={f.address} onChange={s("address")} /></Field></div>
          <Field label="Currency" hint="All amounts are shown in pounds sterling"><Input value="GBP (£)" readOnly className="bg-muted" /></Field>
        </div>
      </Panel>
      <Panel title="Rental Settings">
        <div className="grid gap-4 p-5 sm:grid-cols-3">
          <Field label="Default daily rate (£)" hint="Optional — pre-fills new bookings"><Input type="number" min={0} step="0.01" value={f.defaultDailyRate} onChange={s("defaultDailyRate")} /></Field>
          <Field label="Invoice prefix" hint="e.g. INV-0001"><Input value={f.invoicePrefix} onChange={s("invoicePrefix")} /></Field>
          <Field label="Payment terms (days)"><Input type="number" min={0} value={f.paymentTermsDays} onChange={s("paymentTermsDays")} /></Field>
          <div className="sm:col-span-3">
            <p className="mb-2 text-xs font-medium">Payment methods</p>
            <div className="flex flex-wrap gap-2">{PAYMENT_METHODS.map((m) => <span key={m} className="inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1 text-xs"><CreditCard className="h-3 w-3" />{m}</span>)}</div>
          </div>
        </div>
      </Panel>
      <Panel title="Your Profile">
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="Your name"><div className="relative"><UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={f.userName} onChange={s("userName")} /></div></Field>
        </div>
      </Panel>
    </div>
  );
}
