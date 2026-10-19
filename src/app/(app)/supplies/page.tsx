"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";

type Supply = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  unit: string;
  costPrice: number;
  markupPercent: number;
  customerPrice: number;
  active: boolean;
};

export default function SuppliesPage() {
  const [items, setItems] = useState<Supply[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Supply | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    unit: "each",
    costPrice: "",
    markupPercent: "10",
    active: true,
  });

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/supplies");
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", description: "", category: "", unit: "each", costPrice: "", markupPercent: "10", active: true });
    setOpen(true);
  };

  const openEdit = (s: Supply) => {
    setEditing(s);
    setForm({
      name: s.name,
      description: s.description || "",
      category: s.category || "",
      unit: s.unit,
      costPrice: String(s.costPrice),
      markupPercent: String(s.markupPercent),
      active: s.active,
    });
    setOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      costPrice: Number(form.costPrice) || 0,
      markupPercent: Number(form.markupPercent) || 0,
    };
    const url = editing ? `/api/supplies/${editing.id}` : "/api/supplies";
    const method = editing ? "PATCH" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setOpen(false);
    load();
  };

  const deactivate = async (s: Supply) => {
    await fetch(`/api/supplies/${s.id}`, { method: "DELETE" });
    load();
  };

  const filtered = items.filter((s) => {
    if (!showInactive && !s.active) return false;
    const q = query.toLowerCase();
    return !q || s.name.toLowerCase().includes(q) || (s.category || "").toLowerCase().includes(q);
  });

  const customerPrice = (Number(form.costPrice) || 0) * (1 + (Number(form.markupPercent) || 0) / 100);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Supplies</h1>
          <p className="text-sm text-muted-foreground">Manage catalog items used on invoices</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">
          <Plus className="h-4 w-4" /> Add Supply
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name or category…" className="w-full rounded-lg border border-border bg-card pl-9 pr-3 py-2 text-sm" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
          Show inactive
        </label>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {loading ? <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div> : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No supplies yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Unit</th>
                <th className="px-4 py-3">Cost</th>
                <th className="px-4 py-3">Markup</th>
                <th className="px-4 py-3">Customer Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-white/5">
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3">{s.category || "—"}</td>
                  <td className="px-4 py-3">{s.unit}</td>
                  <td className="px-4 py-3">${s.costPrice.toFixed(2)}</td>
                  <td className="px-4 py-3">{s.markupPercent}%</td>
                  <td className="px-4 py-3">${s.customerPrice.toFixed(2)}</td>
                  <td className="px-4 py-3">{s.active ? "Active" : "Inactive"}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => openEdit(s)} className="text-muted-foreground hover:text-accent"><Pencil className="h-4 w-4" /></button>
                    {s.active && <button onClick={() => deactivate(s)} className="text-danger hover:opacity-80"><Trash2 className="h-4 w-4" /></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit Supply" : "Add Supply"}>
        <form onSubmit={save} className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Name *</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Description</label>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Category</label>
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Unit</label>
              <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm">
                {["each", "litre", "gallon", "kilogram", "tonne", "bag", "jug", "metre", "hour"].map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Cost Price</label>
              <input type="number" step="0.01" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Markup %</label>
              <input type="number" step="0.1" value={form.markupPercent} onChange={(e) => setForm({ ...form, markupPercent: e.target.value })} className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="rounded bg-emerald-500/10 p-2 text-sm">
            Customer price: <strong>${customerPrice.toFixed(2)}</strong>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            Active
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="rounded border border-border px-3 py-1.5 text-sm">Cancel</button>
            <button type="submit" className="rounded bg-accent px-3 py-1.5 text-sm text-accent-foreground">Save</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
