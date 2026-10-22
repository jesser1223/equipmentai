"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Modal } from "@/components/ui/modal";

const emptyForm = { name: "", company: "", email: "", phone: "", address: "", notes: "" };

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<any>(null);
  const [history, setHistory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [toDelete, setToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    const res = await fetch("/api/customers");
    const data = await res.json();
    setCustomers(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(""), 2500);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) {
      setError("Customer name is required.");
      return;
    }
    setSaving(true);
    const res = await fetch(editing ? `/api/customers/${editing.id}` : "/api/customers", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Could not save customer.");
      return;
    }
    setForm(emptyForm);
    setEditing(null);
    showToast(editing ? "Customer updated" : "Customer added");
    load();
  };

  const archive = async (customer: any, archived: boolean) => {
    const res = await fetch(`/api/customers/${customer.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "Could not update customer.");
      return;
    }
    showToast(archived ? "Customer archived" : "Customer restored");
    load();
    if (history?.id === customer.id) openHistory(customer.id);
  };

  const openHistory = async (id: string) => {
    const res = await fetch(`/api/customers/${id}`);
    const data = await res.json();
    if (res.ok) setHistory(data);
  };

  const remove = async () => {
    if (!toDelete) return;
    setDeleting(true);
    setError("");
    const res = await fetch(`/api/customers/${toDelete.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    setDeleting(false);
    if (!res.ok) {
      setError(data.error || "Could not delete");
      return;
    }
    setToDelete(null);
    showToast("Customer deleted");
    load();
  };

  const filtered = customers.filter((customer) => {
    const haystack = [customer.name, customer.company, customer.email, customer.phone].join(" ").toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Customers</h1>
      {toast && <div className="rounded-lg bg-emerald-500/15 px-4 py-2 text-sm text-emerald-400">{toast}</div>}
      {error && !toDelete && <div className="rounded-lg bg-danger/15 px-4 py-2 text-sm text-danger">{error}</div>}

      <form onSubmit={save} className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2">
        <Field label="Name *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
        <Field label="Company" value={form.company} onChange={(v) => setForm({ ...form, company: v })} />
        <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
        <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
        <Field label="Address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
        <Field label="Notes" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} />
        <div className="flex items-end gap-2 sm:col-span-2">
          <button disabled={saving} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50">
            {saving ? "Saving…" : editing ? "Save changes" : "Add customer"}
          </button>
          {editing && (
            <button type="button" onClick={() => { setEditing(null); setForm(emptyForm); }} className="rounded-lg border border-border px-4 py-2 text-sm">
              Cancel
            </button>
          )}
        </div>
      </form>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search customers"
        className="w-full max-w-md rounded-lg border border-border bg-card px-3 py-2 text-sm"
      />

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {loading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">No customers found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Records</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((customer) => (
                <tr key={customer.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium">{customer.name}</div>
                    <div className="text-xs text-muted-foreground">{customer.company || "No company"}{customer.archivedAt ? " · Archived" : ""}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {customer.email || "No email"}<br />{customer.phone || "No phone"}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {customer._count?.quotes || 0} quotes · {customer._count?.jobs || 0} jobs · {customer._count?.invoices || 0} invoices
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openHistory(customer.id)} className="text-xs text-accent">History</button>
                      <button onClick={() => { setEditing(customer); setForm({ name: customer.name || "", company: customer.company || "", email: customer.email || "", phone: customer.phone || "", address: customer.address || "", notes: customer.notes || "" }); }} className="text-muted-foreground hover:text-foreground" aria-label={`Edit ${customer.name}`}><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => archive(customer, !customer.archivedAt)} className="text-xs text-muted-foreground">{customer.archivedAt ? "Restore" : "Archive"}</button>
                      {!customer.archivedAt && (
                        <button onClick={() => { setError(""); setToDelete(customer); }} className="text-muted-foreground hover:text-danger" aria-label={`Delete ${customer.name}`}><Trash2 className="h-4 w-4" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={!!history} onClose={() => setHistory(null)} title={history ? `${history.name} history` : "History"}>
        {history && (
          <div className="space-y-4 text-sm">
            <p className="text-xs text-muted-foreground">{history.company || "No company"} · {history.email || "No email"} · {history.phone || "No phone"}</p>
            <HistoryList title="Quotes" empty="No quotes" items={(history.quotes || []).map((quote: any) => `${quote.number} · ${quote.status} · $${quote.total.toFixed(2)}`)} />
            <HistoryList title="Jobs" empty="No jobs" items={(history.jobs || []).map((job: any) => `${job.title} · ${job.status}${job.startDate ? ` · ${new Date(job.startDate).toLocaleDateString()}` : ""}`)} />
            <HistoryList title="Invoices" empty="No invoices" items={(history.invoices || []).map((invoice: any) => `${invoice.number} · ${invoice.status} · balance $${Math.max(0, invoice.total - invoice.amountPaid).toFixed(2)}`)} />
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => !deleting && setToDelete(null)}
        onConfirm={remove}
        title="Delete customer?"
        description={toDelete ? `Delete “${toDelete.name}”? This is only allowed when the customer has no quotes, jobs, or invoices.` : ""}
        confirmLabel="Delete Customer"
        loading={deleting}
        error={error}
      />
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="text-xs font-medium text-muted-foreground">
      {label}
      <input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" />
    </label>
  );
}

function HistoryList({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <div>
      <h3 className="mb-1 text-xs font-semibold uppercase text-muted-foreground">{title}</h3>
      {items.length === 0 ? <p className="text-xs text-muted-foreground">{empty}</p> : (
        <ul className="space-y-1">{items.map((item) => <li key={item}>{item}</li>)}</ul>
      )}
    </div>
  );
}
