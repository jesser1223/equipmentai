"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Modal } from "@/components/ui/modal";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ customerId: "", dueDate: "", notes: "", description: "", quantity: 1, rate: 0 });
  const [toDelete, setToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [payTarget, setPayTarget] = useState<any>(null);
  const [payAmount, setPayAmount] = useState("");
  const [paying, setPaying] = useState(false);
  const [genJobId, setGenJobId] = useState("");
  const [generating, setGenerating] = useState(false);

  const load = async () => {
    setLoading(true);
    const [inv, cust, jobRes] = await Promise.all([
      fetch("/api/invoices").then((r) => r.json()),
      fetch("/api/customers").then((r) => r.json()),
      fetch("/api/jobs").then((r) => r.json()),
    ]);
    setInvoices(Array.isArray(inv) ? inv : []);
    setCustomers(Array.isArray(cust) ? cust : []);
    setJobs(Array.isArray(jobRes) ? jobRes : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const generateFromJob = async () => {
    if (!genJobId) return;
    const job = jobs.find((j) => j.id === genJobId);
    if (!job) return;
    setGenerating(true);
    const rate = job.equipment?.hourlyRate || 0;
    const hours = 8;
    await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: job.customerId,
        jobId: job.id,
        notes: `Generated from job: ${job.title}`,
        lines: [
          {
            description: `${job.equipment?.name || "Equipment"} – ${job.title}`,
            quantity: hours,
            unit: "hours",
            rate,
          },
        ],
      }),
    });
    setGenerating(false);
    setGenJobId("");
    load();
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: form.customerId,
        dueDate: form.dueDate || null,
        notes: form.notes,
        lines: [{ description: form.description, quantity: Number(form.quantity), rate: Number(form.rate) }],
      }),
    });
    setShowForm(false);
    load();
  };

  const pay = async () => {
    if (!payTarget || !payAmount) return;
    setPaying(true);
    await fetch(`/api/invoices/${payTarget.id}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Number(payAmount), method: "Manual" }),
    });
    setPaying(false);
    setPayTarget(null);
    setPayAmount("");
    load();
  };

  const remove = async () => {
    if (!toDelete) return;
    setDeleting(true);
    await fetch(`/api/invoices/${toDelete.id}`, { method: "DELETE" });
    setDeleting(false);
    setToDelete(null);
    load();
  };

  const outstanding = invoices.reduce((s, i) => s + Math.max(0, i.total - i.amountPaid), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Invoices</h1>
          <p className="text-sm text-muted-foreground">Outstanding: ${outstanding.toFixed(2)}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">
            <Plus className="h-4 w-4" /> Create Invoice
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-4">
        <span className="text-sm text-muted-foreground">Generate from job:</span>
        <select value={genJobId} onChange={(e) => setGenJobId(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
          <option value="">Select job</option>
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>{j.title} – {j.customer?.name}</option>
          ))}
        </select>
        <button
          onClick={generateFromJob}
          disabled={!genJobId || generating}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50"
        >
          {generating ? "Generating…" : "Generate Invoice"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={create} className="space-y-3 rounded-xl border border-border bg-card p-4">
          <select required value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
            <option value="">Select customer</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input required placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          <div className="grid grid-cols-2 gap-3">
            <input type="number" step="0.01" placeholder="Quantity" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <input type="number" step="0.01" placeholder="Rate" value={form.rate} onChange={(e) => setForm({ ...form, rate: Number(e.target.value) })} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          </div>
          <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          <div className="flex gap-2">
            <button type="submit" className="rounded-lg bg-accent px-4 py-2 text-sm text-accent-foreground">Save</button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-border px-4 py-2 text-sm">Cancel</button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {loading ? <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div> : invoices.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No invoices yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Number</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Paid</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-white/5">
                  <td className="px-4 py-3 font-medium">{inv.number}</td>
                  <td className="px-4 py-3">{inv.customer?.name}</td>
                  <td className="px-4 py-3">${inv.total.toFixed(2)}</td>
                  <td className="px-4 py-3">${inv.amountPaid.toFixed(2)}</td>
                  <td className="px-4 py-3">{inv.status}</td>
                  <td className="px-4 py-3 text-right space-x-3">
                    {inv.status !== "Paid" && (
                      <button onClick={() => { setPayTarget(inv); setPayAmount(""); }} className="text-xs text-accent">Record payment</button>
                    )}
                    <button onClick={() => setToDelete(inv)} className="text-danger"><Trash2 className="inline h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => !deleting && setToDelete(null)}
        onConfirm={remove}
        title="Delete invoice?"
        description={toDelete ? `Permanently delete invoice ${toDelete.number}? This cannot be undone.` : ""}
        confirmLabel="Delete Invoice"
        loading={deleting}
      />

      <Modal open={!!payTarget} onClose={() => !paying && setPayTarget(null)} title="Record payment">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Invoice {payTarget?.number} · Balance ${(payTarget ? payTarget.total - payTarget.amountPaid : 0).toFixed(2)}</p>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={payAmount}
            onChange={(e) => setPayAmount(e.target.value)}
            placeholder="Amount"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setPayTarget(null)} className="rounded-lg border border-border px-4 py-2 text-sm">Cancel</button>
            <button onClick={pay} disabled={paying || !payAmount} className="rounded-lg bg-accent px-4 py-2 text-sm text-accent-foreground disabled:opacity-50">
              {paying ? "Saving…" : "Record"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
