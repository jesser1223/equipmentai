"use client";

import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [org, setOrg] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then(setOrg);
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(org),
    });
    setSaving(false);
    if (res.ok) {
      setToast("Settings saved");
      setTimeout(() => setToast(""), 2000);
    }
  };

  if (!org) return <div className="p-8 text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      {toast && <div className="rounded-lg bg-emerald-500/15 px-4 py-2 text-sm text-emerald-400">{toast}</div>}

      <form onSubmit={save} className="space-y-4 rounded-xl border border-border bg-card p-6">
        <Field label="Company name" value={org.name || ""} onChange={(v) => setOrg({ ...org, name: v })} />
        <Field label="Address" value={org.address || ""} onChange={(v) => setOrg({ ...org, address: v })} />
        <Field label="Phone" value={org.phone || ""} onChange={(v) => setOrg({ ...org, phone: v })} />
        <Field label="Email" value={org.email || ""} onChange={(v) => setOrg({ ...org, email: v })} />
        <Field label="Currency" value={org.currency || "CAD"} onChange={(v) => setOrg({ ...org, currency: v })} />
        <Field label="Tax rate (e.g. 0.05 for 5% GST)" value={String(org.taxRate ?? 0)} onChange={(v) => setOrg({ ...org, taxRate: Number(v) })} />
        <Field label="Invoice prefix" value={org.invoicePrefix || "INV"} onChange={(v) => setOrg({ ...org, invoicePrefix: v })} />
        <Field label="Default invoice notes" value={org.defaultNotes || ""} onChange={(v) => setOrg({ ...org, defaultNotes: v })} />
        <Field label="Payment terms" value={org.paymentTerms || ""} onChange={(v) => setOrg({ ...org, paymentTerms: v })} />
        <Field label="GST number" value={org.gstNumber || ""} onChange={(v) => setOrg({ ...org, gstNumber: v })} />
        <Field label="Logo URL" value={org.logoUrl || ""} onChange={(v) => setOrg({ ...org, logoUrl: v })} />
        <Field label="Invoice footer" value={org.invoiceFooter || ""} onChange={(v) => setOrg({ ...org, invoiceFooter: v })} />
        <Field label="Reply-to email" value={org.replyToEmail || ""} onChange={(v) => setOrg({ ...org, replyToEmail: v })} />

        <div className="border-t border-border pt-4 space-y-3">
          <h2 className="text-sm font-semibold">Workflow Automation</h2>
          <p className="text-xs text-muted-foreground">These preferences control automation. Reminders only send when the reminder toggle is on.</p>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!org.autoSendInvoices} onChange={(e) => setOrg({ ...org, autoSendInvoices: e.target.checked })} />
            Automatically email invoices when issued
          </label>
          <p className="text-[11px] text-muted-foreground -mt-2">Off by default. When on, issued invoices are emailed to the customer.</p>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!org.autoSendOverdueReminders} onChange={(e) => setOrg({ ...org, autoSendOverdueReminders: e.target.checked })} />
            Automatically email overdue payment reminders
          </label>
          <p className="text-[11px] text-muted-foreground -mt-2">Off by default. Independent of invoice email. Sends one reminder after the delay below.</p>
          <Field label="Days after an invoice becomes overdue before sending a reminder" value={String(org.overdueReminderDays ?? 7)} onChange={(v) => setOrg({ ...org, overdueReminderDays: Number(v) })} />
          <p className="text-[11px] text-muted-foreground -mt-2">Whole number from 1 to 90.</p>
          <Field label="Days to wait before following up on a sent quote" value={String(org.quoteFollowUpDays ?? 3)} onChange={(v) => setOrg({ ...org, quoteFollowUpDays: Number(v) })} />
          <p className="text-[11px] text-muted-foreground -mt-2">Whole number from 1 to 90. Quote follow-ups are not active yet.</p>
        </div>

        <button disabled={saving} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50">
          {saving ? "Saving…" : "Save Settings"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
    </div>
  );
}
