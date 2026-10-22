"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Trash2, Pencil } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { EquipmentForm } from "@/components/equipment-form";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type Equipment = {
  id: string;
  name: string;
  category: string;
  unitNumber: string;
  status: string;
  location: string | null;
  hourlyRate: number;
  dailyRate: number;
};

const statusStyles: Record<string, string> = {
  Available: "bg-emerald-500/15 text-emerald-400",
  "In Use": "bg-cyan-500/15 text-cyan-400",
  Maintenance: "bg-red-500/15 text-red-400",
  Inactive: "bg-slate-500/15 text-slate-400",
};

export default function EquipmentPage() {
  const [items, setItems] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [toast, setToast] = useState("");

  const [toDelete, setToDelete] = useState<Equipment | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/equipment");
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = items.filter(
    (i) =>
      i.name.toLowerCase().includes(query.toLowerCase()) ||
      i.unitNumber.toLowerCase().includes(query.toLowerCase()) ||
      (i.location || "").toLowerCase().includes(query.toLowerCase())
  );

  const handleSave = async (data: any) => {
    const url = editing ? `/api/equipment/${editing.id}` : "/api/equipment";
    const method = editing ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Save failed");
    }
    setModalOpen(false);
    setEditing(null);
    setToast(editing ? "Equipment updated" : "Equipment saved");
    setTimeout(() => setToast(""), 2500);
    load();
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/equipment/${toDelete.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setDeleteError(data.error || "Could not delete this equipment.");
        return;
      }
      setToDelete(null);
      setToast("Equipment deleted");
      setTimeout(() => setToast(""), 2500);
      load();
    } catch {
      setDeleteError("Network error. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Equipment</h1>
          <p className="text-sm text-muted-foreground">Manage fleet assets, rates, and status</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
        >
          <Plus className="h-4 w-4" /> Add Equipment
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, unit, location…"
          className="w-full rounded-lg border border-border bg-card pl-9 pr-3 py-2 text-sm"
        />
      </div>

      {toast && (
        <div className="rounded-lg bg-emerald-500/15 px-4 py-2 text-sm text-emerald-400">{toast}</div>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No equipment found. Add one to get started.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Unit #</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Rates</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((eq) => (
                <tr key={eq.id} className="hover:bg-white/5">
                  <td className="px-4 py-3 font-medium">{eq.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{eq.unitNumber}</td>
                  <td className="px-4 py-3">{eq.category}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${statusStyles[eq.status] || ""}`}>
                      {eq.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{eq.location || "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    ${eq.hourlyRate}/hr · ${eq.dailyRate}/day
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditing(eq);
                          setModalOpen(true);
                        }}
                        className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-white/5"
                        aria-label={`Edit ${eq.name}`}
                      >
                        <Pencil className="mr-1 inline h-3.5 w-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => {
                          setDeleteError(null);
                          setToDelete(eq);
                        }}
                        className="text-danger hover:opacity-80"
                        aria-label={`Delete ${eq.name}`}
                      >
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

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} title={editing ? "Edit Equipment" : "Add Equipment"}>
        <EquipmentForm
          initial={editing ? {
            ...editing,
            year: editing.year?.toString() || "",
            hourlyRate: editing.hourlyRate?.toString() || "",
            dailyRate: editing.dailyRate?.toString() || "",
            hourMeter: editing.hourMeter?.toString() || "",
            latitude: editing.latitude?.toString() || "",
            longitude: editing.longitude?.toString() || "",
            attachments: (editing.attachments || []).map((a: any) => ({
              name: a.name,
              manufacturer: a.manufacturer || "",
              model: a.model || "",
              serialNumber: a.serialNumber || "",
              billingMethod: a.billingMethod || "hourly",
              rate: a.rate?.toString() || "0",
              notes: a.notes || "",
            })),
          } : undefined}
          onSave={handleSave}
          onCancel={() => { setModalOpen(false); setEditing(null); }}
        />
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => {
          if (!deleting) setToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete equipment?"
        description={
          toDelete
            ? `Permanently delete “${toDelete.name}” (${toDelete.unitNumber})? This cannot be undone. Any quote or job links will be cleared.`
            : ""
        }
        confirmLabel="Delete Equipment"
        loading={deleting}
        error={deleteError}
      />
    </div>
  );
}
