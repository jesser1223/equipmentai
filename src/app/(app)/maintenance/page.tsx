"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/ui/modal";

type MaintenanceRecord = {
  id: string;
  serviceDate: string;
  hourMeterAtService: number | null;
  category: string;
  description: string | null;
  partsCost: number;
  labourCost: number;
  otherCost: number;
  totalCost: number;
  notes: string | null;
  nextServiceHours: number | null;
  nextServiceDate: string | null;
  equipment: { id: string; name: string; unitNumber: string };
};

type Equipment = { id: string; name: string; unitNumber: string };

export default function MaintenancePage() {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [recRes, eqRes] = await Promise.all([
        fetch("/api/maintenance"),
        fetch("/api/equipment"),
      ]);
      const recData = await recRes.json();
      const eqData = await eqRes.json();
      setRecords(Array.isArray(recData) ? recData : []);
      setEquipment(Array.isArray(eqData) ? eqData : []);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (data: any) => {
    const res = await fetch("/api/maintenance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to save");
    }
    setModalOpen(false);
    setToast("Maintenance record saved");
    setTimeout(() => setToast(""), 2500);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Maintenance</h1>
          <p className="text-sm text-muted-foreground">Service history and upcoming work</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
        >
          <Plus className="h-4 w-4" /> Add Record
        </button>
      </div>

      {toast && <div className="rounded-lg bg-emerald-500/15 px-4 py-2 text-sm text-emerald-400">{toast}</div>}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
        ) : records.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No maintenance records yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Equipment</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Hours</th>
                <th className="px-4 py-3 text-right">Total Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-white/5">
                  <td className="px-4 py-3">{new Date(r.serviceDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{r.equipment?.name} ({r.equipment?.unitNumber})</td>
                  <td className="px-4 py-3">{r.category}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.hourMeterAtService ?? "—"}</td>
                  <td className="px-4 py-3 text-right">${r.totalCost.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Maintenance Record">
        <MaintenanceForm equipment={equipment} onSave={handleCreate} onCancel={() => setModalOpen(false)} />
      </Modal>
    </div>
  );
}

function MaintenanceForm({
  equipment,
  onSave,
  onCancel,
}: {
  equipment: Equipment[];
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    equipmentId: "",
    serviceDate: new Date().toISOString().slice(0, 10),
    hourMeterAtService: "",
    category: "Oil Change",
    description: "",
    partsCost: "",
    labourCost: "",
    otherCost: "",
    notes: "",
    nextServiceHours: "",
    nextServiceDate: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.equipmentId || !form.category) {
      setError("Equipment and category are required.");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        ...form,
        hourMeterAtService: form.hourMeterAtService ? Number(form.hourMeterAtService) : null,
        partsCost: Number(form.partsCost) || 0,
        labourCost: Number(form.labourCost) || 0,
        otherCost: Number(form.otherCost) || 0,
        nextServiceHours: form.nextServiceHours ? Number(form.nextServiceHours) : null,
        nextServiceDate: form.nextServiceDate || null,
      });
    } catch (err: any) {
      setError(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <div className="rounded-lg bg-danger/15 px-3 py-2 text-sm text-danger">{error}</div>}
      <div>
        <label className="mb-1 block text-xs font-medium">Equipment *</label>
        <select
          value={form.equipmentId}
          onChange={(e) => setForm({ ...form, equipmentId: e.target.value })}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          required
        >
          <option value="">Select equipment</option>
          {equipment.map((eq) => (
            <option key={eq.id} value={eq.id}>{eq.name} ({eq.unitNumber})</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium">Service Date *</label>
          <input type="date" value={form.serviceDate} onChange={(e) => setForm({ ...form, serviceDate: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" required />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">Hour Meter</label>
          <input type="number" step="0.1" value={form.hourMeterAtService} onChange={(e) => setForm({ ...form, hourMeterAtService: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium">Category *</label>
        <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" required />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium">Description</label>
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" rows={2} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium">Parts Cost</label>
          <input type="number" step="0.01" value={form.partsCost} onChange={(e) => setForm({ ...form, partsCost: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">Labour Cost</label>
          <input type="number" step="0.01" value={form.labourCost} onChange={(e) => setForm({ ...form, labourCost: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">Other Cost</label>
          <input type="number" step="0.01" value={form.otherCost} onChange={(e) => setForm({ ...form, otherCost: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium">Next Service Hours</label>
          <input type="number" step="0.1" value={form.nextServiceHours} onChange={(e) => setForm({ ...form, nextServiceHours: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">Next Service Date</label>
          <input type="date" value={form.nextServiceDate} onChange={(e) => setForm({ ...form, nextServiceDate: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium">Notes</label>
        <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" rows={2} />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="rounded-lg border border-border px-4 py-2 text-sm">Cancel</button>
        <button type="submit" disabled={saving} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50">
          {saving ? "Saving…" : "Save Record"}
        </button>
      </div>
    </form>
  );
}
