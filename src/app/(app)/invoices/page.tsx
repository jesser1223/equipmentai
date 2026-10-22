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
  const [emailTarget, setEmailTarget] = useState<any>(null);
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailing, setEmailing] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [taxRate, setTaxRate] = useState(0.05);
  const [formError, setFormError] = useState("");
  const [editTarget, setEditTarget] = useState<any>(null);
  const [editLines, setEditLines] = useState<any[]>([]);
  const [editNotes, setEditNotes] = useState("");
  const [editDue, setEditDue] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");

  const load = async () => {
    setLoading(true);
    const [inv, cust, jobRes, eqRes, settingsRes] = await Promise.all([
      fetch("/api/invoices").then((r) => r.json()),
      fetch("/api/customers").then((r) => r.json()),
      fetch("/api/jobs").then((r) => r.json()),
      fetch("/api/equipment").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ]);
    setInvoices(Array.isArray(inv) ? inv : []);
    setCustomers(Array.isArray(cust) ? cust : []);
    setJobs(Array.isArray(jobRes) ? jobRes : []);
    setEquipmentList(Array.isArray(eqRes) ? eqRes : []);
    if (settingsRes?.taxRate != null) setTaxRate(Number(settingsRes.taxRate));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const previewSubtotal = () => {
    const eq = equipmentList.find((e: any) => e.id === selectedEquipment[0]);
    const machine = (equipmentHours[selectedEquipment[0]] || 0) * (eq?.hourlyRate || 0);
    const atts = Object.entries(selectedAttachments).reduce((s, [id, hrs]) => {
      const att = eq?.attachments?.find((a: any) => a.id === id);
      return s + (hrs || 0) * (att?.rate || 0);
    }, 0);
    return machine + atts + (Number(form.rate) || 0);
  };

  const create = async () => {
    setFormError("");
    if (!form.customerId) {
      setFormError("Select a customer.");
      return;
    }
    const eq = equipmentList.find((e: any) => e.id === selectedEquipment[0]);
    const hours = equipmentHours[selectedEquipment[0]] || 0;
    if (selectedEquipment[0] && (!hours || hours <= 0)) {
      setFormError("Enter machine hours greater than zero.");
      return;
    }
    if (!selectedEquipment[0] && !(Number(form.rate) > 0)) {
      setFormError("Add equipment hours or other charges.");
      return;
    }

    const attachments = Object.entries(selectedAttachments)
      .filter(([, hrs]) => hrs && hrs > 0)
      .map(([id, hrs]) => ({ id, hours: hrs }));

    const otherCharges = Number(form.rate) > 0
      ? [{ description: "Fuel, supplies and other charges", amount: Number(form.rate) }]
      : [];

    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: form.customerId,
        dueDate: form.dueDate || null,
        notes: form.notes || form.description || null,
        jobId: genJobId || null,
        equipment: selectedEquipment[0] ? { id: selectedEquipment[0], hours } : null,
        attachments,
        otherCharges,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setFormError(data.error || "Could not create invoice.");
      return;
    }
    setShowForm(false);
    setWizardStep(1);
    setSelectedEquipment([]);
    setEquipmentHours({});
    setSelectedAttachments({});
    setForm({ customerId: "", dueDate: "", notes: "", description: "", quantity: 1, rate: 0 });
    setGenJobId("");
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

  const outstanding = invoices
    .filter((i) => i.status !== "Void" && i.status !== "Paid")
    .reduce((s, i) => s + Math.max(0, i.total - i.amountPaid), 0);

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
              if (job.equipmentId) {
                setSelectedEquipment([job.equipmentId]);
                setEquipmentHours({});
              }
              setWizardStep(1);
              setFormError("Enter the actual machine hours for this job before generating the invoice.");
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
                <div className="text-xs text-muted-foreground">Subtotal before GST</div>
                <div className="text-xl font-semibold text-emerald-400">
                  ${previewSubtotal().toFixed(2)}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  GST at {(taxRate * 100).toFixed(1)}% will be added on save. Rates come from the selected equipment and attachments.
                </div>
              </div>
            </div>
          )}

          {wizardStep === 2 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Review</h3>
              <p className="text-sm">Customer: {customers.find((c) => c.id === form.customerId)?.name || "—"}</p>
              <p className="text-sm">Machine: {equipmentList.find((e: any) => e.id === selectedEquipment[0])?.name || "—"}</p>
              <p className="text-sm">Hours: {equipmentHours[selectedEquipment[0]] || 0}</p>
              <p className="font-medium">Subtotal: ${previewSubtotal().toFixed(2)}</p>
              <p className="font-medium">GST ({(taxRate * 100).toFixed(1)}%): ${(previewSubtotal() * taxRate).toFixed(2)}</p>
              <p className="font-semibold">Total: ${(previewSubtotal() * (1 + taxRate)).toFixed(2)}</p>
              {formError && <p className="text-sm text-red-400">{formError}</p>}
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
                    <a
                      href={`/api/invoices/${inv.id}/pdf`}
                      className="text-xs text-accent hover:underline"
                    >
                      Download PDF
                    </a>
                    <button
                      onClick={() => {
                        setEmailTarget(inv);
                        setEmailTo(inv.customer?.email || "");
                        setEmailSubject(`Invoice ${inv.number} from ${inv.organization?.name || "EquipmentAI"}`);
                        setEmailError("");
                      }}
                      className="text-xs text-accent hover:underline"
                    >
                      Email
                    </button>
                    {inv.status !== "Void" && (
                      <button
                        onClick={() => {
                          setEditTarget(inv);
                          setEditLines((inv.lines || []).map((l: any) => ({ ...l })));
                          setEditNotes(inv.notes || "");
                          setEditDue(inv.dueDate ? String(inv.dueDate).slice(0, 10) : "");
                          setEditError("");
                        }}
                        className="text-xs text-accent hover:underline"
                      >
                        Edit
                      </button>
                    )}
                    {inv.status !== "Paid" && inv.status !== "Void" && (
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

      <Modal open={!!editTarget} onClose={() => !savingEdit && setEditTarget(null)} title={`Edit ${editTarget?.number || "invoice"}`}>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Due date</label>
            <input type="date" value={editDue} onChange={(e) => setEditDue(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Notes</label>
            <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" rows={2} />
          </div>
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">Line items</div>
            {editLines.map((line, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2">
                <input
                  value={line.description || ""}
                  onChange={(e) => {
                    const next = [...editLines];
                    next[idx] = { ...next[idx], description: e.target.value };
                    setEditLines(next);
                  }}
                  className="col-span-6 rounded-lg border border-border bg-background px-2 py-2 text-sm"
                  placeholder="Description"
                />
                <input
                  type="number"
                  step="0.1"
                  value={line.quantity}
                  onChange={(e) => {
                    const next = [...editLines];
                    next[idx] = { ...next[idx], quantity: Number(e.target.value) };
                    setEditLines(next);
                  }}
                  className="col-span-2 rounded-lg border border-border bg-background px-2 py-2 text-sm"
                  placeholder="Qty"
                />
                <input
                  type="number"
                  step="0.01"
                  value={line.rate}
                  onChange={(e) => {
                    const next = [...editLines];
                    next[idx] = { ...next[idx], rate: Number(e.target.value) };
                    setEditLines(next);
                  }}
                  className="col-span-3 rounded-lg border border-border bg-background px-2 py-2 text-sm"
                  placeholder="Rate"
                />
                <button
                  type="button"
                  onClick={() => setEditLines(editLines.filter((_, i) => i !== idx))}
                  className="col-span-1 text-danger"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setEditLines([...editLines, { description: "", quantity: 1, rate: 0, unit: "each" }])}
              className="text-xs text-accent"
            >
              + Add line
            </button>
          </div>
          {editError && <p className="text-sm text-red-400">{editError}</p>}
          <div className="flex justify-end gap-2">
            <button onClick={() => setEditTarget(null)} className="rounded-lg border border-border px-4 py-2 text-sm">Cancel</button>
            <button
              disabled={savingEdit}
              onClick={async () => {
                if (!editTarget) return;
                setSavingEdit(true);
                setEditError("");
                const res = await fetch(`/api/invoices/${editTarget.id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ notes: editNotes, dueDate: editDue || null, lines: editLines }),
                });
                setSavingEdit(false);
                if (!res.ok) {
                  const data = await res.json().catch(() => ({}));
                  setEditError(data.error || "Could not save invoice.");
                  return;
                }
                setEditTarget(null);
                load();
              }}
              className="rounded-lg bg-accent px-4 py-2 text-sm text-accent-foreground disabled:opacity-50"
            >
              {savingEdit ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </Modal>
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
      <Modal open={!!emailTarget} onClose={() => !emailing && setEmailTarget(null)} title="Email invoice">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Send invoice {emailTarget?.number} to:
          </p>
          <input
            type="email"
            value={emailTo}
            onChange={(e) => setEmailTo(e.target.value)}
            placeholder="customer@example.com"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            value={emailSubject}
            onChange={(e) => setEmailSubject(e.target.value)}
            placeholder="Subject"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          {emailError && (
            <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {emailError}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button onClick={() => setEmailTarget(null)} className="rounded-lg border border-border px-4 py-2 text-sm">Cancel</button>
            <button
              onClick={async () => {
                if (!emailTo) return;
                setEmailing(true);
                setEmailError("");
                try {
                  const res = await fetch(`/api/invoices/${emailTarget.id}/email`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ to: emailTo, subject: emailSubject }),
                  });
                  const data = await res.json();
                  if (res.ok) {
                    setEmailTarget(null);
                    setEmailSuccess(true);
                    setTimeout(() => setEmailSuccess(false), 3000);
                  } else {
                    setEmailError(data.error || "Failed to send");
                  }
                } catch {
                  setEmailError("Failed to send. Check your connection and try again.");
                } finally {
                  setEmailing(false);
                }
              }}
              disabled={emailing || !emailTo}
              className="rounded-lg bg-accent px-4 py-2 text-sm text-accent-foreground disabled:opacity-50"
            >
              {emailing ? "Sending…" : "Send"}
            </button>
          </div>
        </div>
      </Modal>

      {emailSuccess && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl border border-accent/40 bg-card px-5 py-3 text-sm font-medium shadow-lg">
          Invoice sent
        </div>
      )}
    </div>
  );
}
