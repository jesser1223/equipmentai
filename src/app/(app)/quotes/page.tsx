"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { normalizeTaxRate, quoteTaxAmount, quoteTotal } from "@/lib/quotes";

type Customer = { id: string; name: string };
type Equipment = { id: string; name: string; unitNumber: string; hourlyRate: number };
type Line = { equipmentId: string; description: string; quantity: number; rate: number; amount: number };

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [toDelete, setToDelete] = useState<any>(null);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [convertTarget, setConvertTarget] = useState<any>(null);
  const [convertForm, setConvertForm] = useState({ startDate: "", endDate: "", equipmentId: "", location: "" });
  const [converting, setConverting] = useState(false);
  const [convertError, setConvertError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const setStatus = async (quote: any, status: string) => {
    const res = await fetch(`/api/quotes/${quote.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setToast(data.error || "Could not update status");
      setTimeout(() => setToast(""), 2500);
      return;
    }
    load();
  };

  const openConvert = (quote: any) => {
    setConvertTarget(quote);
    setConvertError("");
    setConvertForm({
      startDate: "",
      endDate: "",
      equipmentId: quote.lines?.find((line: any) => line.equipmentId)?.equipmentId || "",
      location: quote.location || "",
    });
  };

  const load = async () => {
    const [q, c, e] = await Promise.all([
      fetch("/api/quotes").then((r) => r.json()),
      fetch("/api/customers").then((r) => r.json()),
      fetch("/api/equipment").then((r) => r.json()),
    ]);
    setQuotes(Array.isArray(q) ? q : []);
    setCustomers(Array.isArray(c) ? c.filter((customer: any) => !customer.archivedAt) : []);
    setEquipment(Array.isArray(e) ? e : []);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Quotes</h1>
          <p className="text-sm text-muted-foreground">Create and manage customer quotes</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
        >
          <Plus className="h-4 w-4" /> Create Quote
        </button>
      </div>

      {toast && <div className="rounded-lg bg-emerald-500/15 px-4 py-2 text-sm text-emerald-400">{toast}</div>}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {quotes.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No quotes yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Number</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Job</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {quotes.map((q) => (
                <tr key={q.id} className="hover:bg-white/5">
                  <td className="px-4 py-3 font-medium">{q.number}</td>
                  <td className="px-4 py-3">{q.customer?.name}</td>
                  <td className="px-4 py-3">{q.jobName}</td>
                  <td className="px-4 py-3">{q.status}</td>
                  <td className="px-4 py-3">${q.total.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {q.status === "Draft" && <button onClick={() => setStatus(q, "Sent")} className="text-xs text-accent">Mark sent</button>}
                      {q.status === "Sent" && (
                        <>
                          <button onClick={() => setStatus(q, "Accepted")} className="text-xs text-accent">Accept</button>
                          <button onClick={() => setStatus(q, "Declined")} className="text-xs text-muted-foreground">Decline</button>
                        </>
                      )}
                      {q.status === "Accepted" && !q.job && (
                        <button onClick={() => openConvert(q)} className="rounded-lg bg-accent px-3 py-1.5 text-xs text-accent-foreground">Convert to job</button>
                      )}
                      {q.job && <span className="text-xs text-muted-foreground">Job {q.job.status}</span>}
                      {!q.job && (
                        <button onClick={() => setEditTarget(q)} className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-white/5">
                          <Pencil className="mr-1 inline h-3.5 w-3.5" /> Edit
                        </button>
                      )}
                      <button onClick={() => setToDelete(q)} className="text-muted-foreground hover:text-danger">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title={`Edit ${editTarget?.number || "quote"}`}>
        {editTarget && (
          <QuoteForm
            customers={customers}
            equipment={equipment}
            initial={editTarget}
            onSaved={() => {
              setEditTarget(null);
              setToast("Quote updated");
              setTimeout(() => setToast(""), 2500);
              load();
            }}
          />
        )}
      </Modal>
      <Modal open={open} onClose={() => setOpen(false)} title="Create Quote">
        <QuoteForm
          customers={customers}
          equipment={equipment}
          onSaved={() => {
            setOpen(false);
            setToast("Quote saved");
            setTimeout(() => setToast(""), 2500);
            load();
          }}
        />
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete quote?"
        description={`Permanently delete quote ${toDelete?.number}? This cannot be undone.`}
        confirmLabel="Delete Quote"
        loading={deleting}
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return;
          setDeleting(true);
          const res = await fetch(`/api/quotes/${toDelete.id}`, { method: "DELETE" });
          setDeleting(false);
          if (res.ok) {
            setToDelete(null);
            load();
          } else {
            const data = await res.json();
            setToast(data.error || "Could not delete");
            setTimeout(() => setToast(""), 2500);
            setToDelete(null);
          }
        }}
      />
      <Modal open={!!convertTarget} onClose={() => !converting && setConvertTarget(null)} title={`Convert ${convertTarget?.number || "quote"}`}>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!convertTarget) return;
            setConverting(true);
            setConvertError("");
            const res = await fetch(`/api/quotes/${convertTarget.id}/convert`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(convertForm),
            });
            const data = await res.json().catch(() => ({}));
            setConverting(false);
            if (!res.ok) {
              setConvertError(data.error || "Could not convert quote.");
              return;
            }
            setConvertTarget(null);
            setToast(`Job scheduled: ${data.title}`);
            setTimeout(() => setToast(""), 2500);
            load();
          }}
        >
          <p className="text-xs text-muted-foreground">Review the job details. Dates are required and are not guessed.</p>
          <label className="block text-xs text-muted-foreground">Location
            <input value={convertForm.location} onChange={(e) => setConvertForm({ ...convertForm, location: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          </label>
          <label className="block text-xs text-muted-foreground">Equipment
            <select value={convertForm.equipmentId} onChange={(e) => setConvertForm({ ...convertForm, equipmentId: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
              <option value="">No equipment</option>
              {equipment.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.unitNumber})</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-muted-foreground">Start date *
              <input type="date" required value={convertForm.startDate} onChange={(e) => setConvertForm({ ...convertForm, startDate: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            </label>
            <label className="text-xs text-muted-foreground">End date
              <input type="date" value={convertForm.endDate} onChange={(e) => setConvertForm({ ...convertForm, endDate: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            </label>
          </div>
          {convertError && <p className="text-sm text-red-400">{convertError}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setConvertTarget(null)} className="rounded-lg border border-border px-4 py-2 text-sm">Cancel</button>
            <button disabled={converting} className="rounded-lg bg-accent px-4 py-2 text-sm text-accent-foreground disabled:opacity-50">{converting ? "Converting…" : "Create job"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function QuoteForm({
  customers,
  equipment,
  onSaved,
  initial,
}: {
  customers: Customer[];
  equipment: Equipment[];
  onSaved: () => void;
  initial?: any;
}) {
  const [customerId, setCustomerId] = useState(initial?.customerId || customers[0]?.id || "");
  const [jobName, setJobName] = useState(initial?.jobName || "");
  const [location, setLocation] = useState(initial?.location || "");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [lines, setLines] = useState<Line[]>(
    initial?.lines?.length
      ? initial.lines.map((l: any) => ({
          equipmentId: l.equipmentId || "",
          description: l.description || "",
          quantity: l.quantity || 1,
          rate: l.rate || 0,
          amount: l.amount || 0,
        }))
      : [{ equipmentId: "", description: "", quantity: 1, rate: 0, amount: 0 }]
  );
  const [taxRate, setTaxRate] = useState(normalizeTaxRate(Number(initial?.taxRate) || 0));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const updateLine = (idx: number, patch: Partial<Line>) => {
    setLines((prev) => {
      const next = [...prev];
      const line = { ...next[idx], ...patch };
      if (patch.equipmentId) {
        const eq = equipment.find((e) => e.id === patch.equipmentId);
        if (eq) {
          line.description = eq.name;
          line.rate = eq.hourlyRate;
        }
      }
      line.amount = (line.quantity || 0) * (line.rate || 0);
      next[idx] = line;
      return next;
    });
  };

  const subtotal = lines.reduce((s, l) => s + l.amount, 0);
  const tax = quoteTaxAmount(subtotal, taxRate);
  const total = quoteTotal(subtotal, taxRate);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !jobName.trim()) {
      setError("Customer and job name are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(initial ? `/api/quotes/${initial.id}` : "/api/quotes", {
        method: initial ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          jobName,
          location,
          notes,
          taxRate,
          lines: lines.filter((l) => l.description),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Save failed");
      }
      onSaved();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <div className="rounded bg-danger/15 px-3 py-2 text-sm text-danger">{error}</div>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs text-muted-foreground">Customer</label>
          <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Job Name *</label>
          <input value={jobName} onChange={(e) => setJobName(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground">Location</label>
        <input value={location} onChange={(e) => setLocation(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium">Line Items</div>
        {lines.map((line, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-end">
            <select
              value={line.equipmentId}
              onChange={(e) => updateLine(i, { equipmentId: e.target.value })}
              className="col-span-4 rounded border border-border bg-background px-2 py-1 text-sm"
            >
              <option value="">— Select equipment —</option>
              {equipment.map((eq) => (
                <option key={eq.id} value={eq.id}>{eq.name} ({eq.unitNumber})</option>
              ))}
            </select>
            <input
              value={line.quantity}
              type="number"
              onChange={(e) => updateLine(i, { quantity: Number(e.target.value) })}
              className="col-span-2 rounded border border-border bg-background px-2 py-1 text-sm"
              placeholder="Qty"
            />
            <input
              value={line.rate}
              type="number"
              onChange={(e) => updateLine(i, { rate: Number(e.target.value) })}
              className="col-span-2 rounded border border-border bg-background px-2 py-1 text-sm"
              placeholder="Rate"
            />
            <div className="col-span-3 text-sm">${line.amount.toFixed(2)}</div>
            <button type="button" onClick={() => setLines(lines.filter((_, j) => j !== i))} className="col-span-1 text-muted-foreground hover:text-danger">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setLines([...lines, { equipmentId: "", description: "", quantity: 1, rate: 0, amount: 0 }])}
          className="text-xs text-accent"
        >
          + Add line
        </button>
      </div>

      <div className="rounded-lg border border-border bg-background/50 p-3 text-sm">
        <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span>Tax %</span>
          <span>GST ({(normalizeTaxRate(taxRate) * 100).toFixed(1)}%)</span>
          <input type="number" step="0.001" value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value))} className="w-20 rounded border border-border bg-card px-2 py-0.5 text-right text-sm" title="0.05 means 5%" />
        </div>
        <div className="mt-1 flex justify-between font-medium"><span>Total</span><span>${total.toFixed(2)}</span></div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground">Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" rows={2} />
      </div>

      <div className="flex justify-end">
        <button disabled={saving} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50">
          {saving ? "Saving…" : initial ? "Save changes" : "Save Quote"}
        </button>
      </div>
    </form>
  );
}
