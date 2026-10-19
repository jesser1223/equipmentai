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
  const [wizardStep, setWizardStep] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [equipmentList, setEquipmentList] = useState<any[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [equipmentHours, setEquipmentHours] = useState<Record<string, number>>({});
  const [selectedAttachments, setSelectedAttachments] = useState<Record<string, number>>({});
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
    const [inv, cust, jobRes, eqRes] = await Promise.all([
      fetch("/api/invoices").then((r) => r.json()),
      fetch("/api/customers").then((r) => r.json()),
      fetch("/api/jobs").then((r) => r.json()),
      fetch("/api/equipment").then((r) => r.json()),
    ]);
    setInvoices(Array.isArray(inv) ? inv : []);
    setCustomers(Array.isArray(cust) ? cust : []);
    setJobs(Array.isArray(jobRes) ? jobRes : []);
    setEquipmentList(Array.isArray(eqRes) ? eqRes : []);
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
          onClick={() => {
            if (!genJobId) return;
            const job = jobs.find((j) => j.id === genJobId);
            if (job) {
              setForm({
                ...form,
                customerId: job.customerId || "",
                description: job.title || "",
              });
              setWizardStep(1);
            }
            setShowForm(true);
          }}
          disabled={!genJobId}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50"
        >
          Generate Invoice
        </button>
      </div>

      {showForm && (
        <Modal open={showForm} onClose={() => setShowForm(false)} title="Generate Invoice">
          <p className="mb-2 text-xs text-muted-foreground">Enter the work completed to calculate your invoice.</p>
          <div className="mb-4 h-1 w-full rounded bg-white/10">
            <div className="h-1 rounded bg-accent" style={{ width: `${(wizardStep / 3) * 100}%` }} />
          </div>
          <p className="mb-4 text-[11px] uppercase tracking-wide text-muted-foreground">Step {wizardStep} of 3</p>

          {wizardStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium">Customer</label>
                <select value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                  <option value="">Existing customer</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium">Which machine was used?</label>
                <select
                  value={selectedEquipment[0] || ""}
                  onChange={(e) => setSelectedEquipment(e.target.value ? [e.target.value] : [])}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select machine</option>
                  {equipmentList.map((eq: any) => <option key={eq.id} value={eq.id}>{eq.name} ({eq.unitNumber})</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium">Machine hours worked</label>
                <input
                  type="number"
                  step="0.1"
                  value={selectedEquipment[0] ? (equipmentHours[selectedEquipment[0]] || "") : ""}
                  onChange={(e) => {
                    if (!selectedEquipment[0]) return;
                    setEquipmentHours({ ...equipmentHours, [selectedEquipment[0]]: Number(e.target.value) });
                  }}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  placeholder="8"
                />
              </div>

              <div>
                <h4 className="text-sm font-semibold">Which attachments were used?</h4>
                <p className="mb-2 text-xs text-muted-foreground">Check each attachment used and enter its hours.</p>
                {selectedEquipment[0] ? (
                  <div className="space-y-2">
                    {(equipmentList.find((e: any) => e.id === selectedEquipment[0])?.attachments || []).length === 0 && (
                      <p className="text-xs text-muted-foreground">No attachments configured for this machine.</p>
                    )}
                    {(equipmentList.find((e: any) => e.id === selectedEquipment[0])?.attachments || []).map((att: any) => (
                      <label key={att.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedAttachments[att.id] !== undefined}
                            onChange={(e) => {
                              const next = { ...selectedAttachments };
                              if (e.target.checked) next[att.id] = 0;
                              else delete next[att.id];
                              setSelectedAttachments(next);
                            }}
                          />
                          <div>
                            <div>{att.name}</div>
                            {selectedAttachments[att.id] !== undefined && (
                              <div className="text-xs text-muted-foreground">Hours used · ${att.rate}/hour</div>
                            )}
                          </div>
                        </div>
                        {selectedAttachments[att.id] !== undefined && (
                          <input
                            type="number"
                            step="0.1"
                            value={selectedAttachments[att.id] || ""}
                            onChange={(e) => setSelectedAttachments({ ...selectedAttachments, [att.id]: Number(e.target.value) })}
                            className="w-16 rounded-full border border-border bg-background px-2 py-1 text-center text-sm"
                          />
                        )}
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Select a machine to see its attachments.</p>
                )}
              </div>

              <div>
                <label className="text-xs font-medium">Fuel, supplies and other charges ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.rate || ""}
                  onChange={(e) => setForm({ ...form, rate: Number(e.target.value) })}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  placeholder="0"
                />
              </div>

              <div className="rounded-lg bg-emerald-500/10 p-3">
                <div className="text-xs text-muted-foreground">Illustrative equipment and attachment subtotal</div>
                <div className="text-xl font-semibold text-emerald-400">
                  ${(() => {
                    const eq = equipmentList.find((e: any) => e.id === selectedEquipment[0]);
                    const machine = (equipmentHours[selectedEquipment[0]] || 0) * (eq?.hourlyRate || 0);
                    const atts = Object.entries(selectedAttachments).reduce((s, [id, hrs]) => {
                      const att = eq?.attachments?.find((a: any) => a.id === id);
                      return s + (hrs || 0) * (att?.rate || 0);
                    }, 0);
                    return (machine + atts + (form.rate || 0)).toFixed(2);
                  })()}
                </div>
                <div className="text-[11px] text-muted-foreground">Example rates only, before GST. This preview does not create or save an invoice.</div>
              </div>
            </div>
          )}

          {wizardStep === 2 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Review</h3>
              <p className="text-sm">Customer: {customers.find((c) => c.id === form.customerId)?.name || "—"}</p>
              <p className="text-sm">Machine: {equipmentList.find((e: any) => e.id === selectedEquipment[0])?.name || "—"}</p>
              <p className="text-sm">Hours: {equipmentHours[selectedEquipment[0]] || 0}</p>
              <p className="font-medium">Subtotal: ${(() => {
                const eq = equipmentList.find((e: any) => e.id === selectedEquipment[0]);
                const machine = (equipmentHours[selectedEquipment[0]] || 0) * (eq?.hourlyRate || 0);
                const atts = Object.entries(selectedAttachments).reduce((s, [id, hrs]) => {
                  const att = eq?.attachments?.find((a: any) => a.id === id);
                  return s + (hrs || 0) * (att?.rate || 0);
                }, 0);
                return (machine + atts + (form.rate || 0)).toFixed(2);
              })()}</p>
            </div>
          )}

          <div className="mt-6 flex justify-between">
            <button type="button" onClick={() => wizardStep > 1 ? setWizardStep(wizardStep - 1) : setShowForm(false)} className="rounded-lg border border-border px-4 py-2 text-sm">
              {wizardStep > 1 ? "Back / Job details" : "Cancel"}
            </button>
            {wizardStep < 2 ? (
              <button type="button" onClick={() => setWizardStep(2)} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">
                Review invoice →
              </button>
            ) : (
              <button type="button" onClick={create} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">
                Generate Invoice
              </button>
            )}
          </div>
        </Modal>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {loading ? <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div> : invoices.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No invoices yet.</div>
        ) : (
          <table className="w-full min-w-[600px] text-sm">
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
                    <a
                      href={`/invoices/${inv.id}/print`}
                      target="_blank"
                      className="text-xs text-accent hover:underline"
                    >
                      Print
                    </a>
                    <button
                      onClick={async () => {
                        const to = prompt("Send invoice to email:");
                        if (!to) return;
                        const res = await fetch(`/api/invoices/${inv.id}/email`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ to }),
                        });
                        const data = await res.json();
                        alert(res.ok ? "Email sent" : data.error || "Failed to send");
                      }}
                      className="text-xs text-accent hover:underline"
                    >
                      Email
                    </button>
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
