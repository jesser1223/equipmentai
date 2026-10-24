"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2, CheckCircle } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export default function SchedulePage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const emptyForm = {
    title: "",
    description: "",
    customerId: "",
    equipmentId: "",
    startDate: "",
    endDate: "",
    location: "",
    street: "",
    city: "",
    province: "BC",
    postalCode: "",
    country: "Canada",
    notes: "",
    status: "Scheduled",
  };
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [toComplete, setToComplete] = useState<any>(null);
  const [completeForm, setCompleteForm] = useState({
    actualHours: "",
    actualAttachmentHours: "",
    drivingHours: "",
    fuelLiters: "",
    fuelCost: "",
    completionNotes: "",
  });
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState("");
  const [toDelete, setToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const toDateInput = (value?: string | null) => {
    if (!value) return "";
    const date = new Date(value);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${date.getFullYear()}-${month}-${day}`;
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  };

  const splitAddress = (value?: string | null) => {
    const parts = (value || "").split(",").map((part) => part.trim()).filter(Boolean);
    return {
      street: parts[0] || "",
      city: parts[1] || "",
      province: parts[2] || "BC",
      postalCode: parts[3] || "",
      country: parts[4] || "Canada",
    };
  };

  const openEdit = (job: any) => {
    setEditingId(job.id);
    setForm({
      title: job.title || "",
      description: "",
      customerId: job.customerId || "",
      equipmentId: job.equipmentId || "",
      startDate: toDateInput(job.startDate),
      endDate: toDateInput(job.endDate),
      location: job.location || "",
      ...splitAddress(job.location),
      notes: job.notes || "",
      status: job.status || "Scheduled",
    });
    setError("");
    setShowForm(true);
  };

  const load = async () => {
    const [j, c, e] = await Promise.all([
      fetch("/api/jobs").then((r) => r.json()),
      fetch("/api/customers").then((r) => r.json()),
      fetch("/api/equipment").then((r) => r.json()),
    ]);
    setJobs(Array.isArray(j) ? j : []);
    setCustomers(Array.isArray(c) ? c.filter((customer: any) => !customer.archivedAt) : []);
    setEquipment(Array.isArray(e) ? e : []);
  };

  useEffect(() => { load(); }, []);

  const selectedCustomer = customers.find((c) => c.id === form.customerId);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.title.trim() || !form.customerId) {
      setError("Job title and customer are required.");
      return;
    }
    if (!form.street.trim() || !form.city.trim()) {
      setError("Street address and city are required so the job can be placed on the map.");
      return;
    }
    const location = [form.street, form.city, form.province, form.postalCode, form.country]
      .map((part) => part.trim())
      .filter(Boolean)
      .join(", ");
    setSaving(true);
    const res = await fetch(editingId ? `/api/jobs/${editingId}` : "/api/jobs", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, location }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Could not save job");
      return;
    }
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    load();
  };

  const handleComplete = async () => {
    if (!toComplete) return;
    setCompleting(true);
    setCompleteError("");
    try {
      const res = await fetch(`/api/jobs/${toComplete.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actualHours: completeForm.actualHours ? Number(completeForm.actualHours) : null,
          actualAttachmentHours: completeForm.actualAttachmentHours ? Number(completeForm.actualAttachmentHours) : null,
          drivingHours: completeForm.drivingHours ? Number(completeForm.drivingHours) : null,
          fuelLiters: completeForm.fuelLiters ? Number(completeForm.fuelLiters) : null,
          fuelCost: completeForm.fuelCost ? Number(completeForm.fuelCost) : null,
          completionNotes: completeForm.completionNotes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCompleteError(data.error || "Could not complete job");
        return;
      }
      setToComplete(null);
      setCompleteForm({ actualHours: "", actualAttachmentHours: "", drivingHours: "", fuelLiters: "", fuelCost: "", completionNotes: "" });
      load();
    } catch {
      setCompleteError("Network error");
    } finally {
      setCompleting(false);
    }
  };
  const filtered = jobs.filter((j) => filterStatus === "all" || j.status === filterStatus);
  const upcoming = jobs.filter((j) => j.status === "Scheduled").length;
  const active = jobs.filter((j) => j.status === "In Progress").length;
  const completed = jobs.filter((j) => j.status === "Completed").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Schedule</h1>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">
          <Plus className="h-4 w-4" /> Schedule a Job
        </button>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Schedule Overview</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4"><div className="text-2xl font-semibold">{upcoming}</div><div className="text-xs text-muted-foreground">Upcoming</div></div>
          <div className="rounded-xl border border-border bg-card p-4"><div className="text-2xl font-semibold">{active}</div><div className="text-xs text-muted-foreground">Active</div></div>
          <div className="rounded-xl border border-border bg-card p-4"><div className="text-2xl font-semibold">{completed}</div><div className="text-xs text-muted-foreground">Completed</div></div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Filters</h2>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="all">All statuses</option>
          <option value="Scheduled">Scheduled</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Scheduled Jobs</h2>
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">No jobs match the filter.</div>
        ) : (
          <div className="space-y-2">
            {filtered.map((j) => (
              <div key={j.id} className="flex items-start justify-between rounded-xl border border-border bg-card p-4">
                <div>
                  <div className="font-medium">{j.title}</div>
                  <div className="text-sm text-muted-foreground">{j.customer?.name || "No customer"} · {j.location || "No job-site address"}</div>
                  <div className="text-xs text-muted-foreground">
                    {j.startDate ? new Date(j.startDate).toLocaleDateString() : "Unscheduled"}
                    {j.endDate ? ` – ${new Date(j.endDate).toLocaleDateString()}` : ""}
                    {" · "}{j.status}
                    {j.equipment ? ` · ${j.equipment.name}` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {j.status !== "Completed" && (
                    <button
                      onClick={() => { setCompleteError(""); setToComplete(j); }}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-white/5"
                    >
                      <CheckCircle className="mr-1 inline h-3.5 w-3.5" /> Complete
                    </button>
                  )}
                  <button onClick={() => openEdit(j)} className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-white/5">
                    <Pencil className="mr-1 inline h-3.5 w-3.5" /> Edit
                  </button>
                  <button onClick={() => { setDeleteError(""); setToDelete(j); }} className="text-muted-foreground hover:text-danger" title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Modal open={showForm} onClose={() => { setShowForm(false); setEditingId(null); }} title={editingId ? "Edit Job" : "Schedule a Job"}>
        <form onSubmit={save} className="max-h-[70vh] space-y-5 overflow-y-auto pr-1">
          {error && <div className="rounded-lg bg-danger/15 px-3 py-2 text-sm text-danger">{error}</div>}

          <section className="space-y-2">
            <h3 className="text-sm font-semibold">Customer Information</h3>
            <label className="text-xs text-muted-foreground">Customer *</label>
            <select required value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} className="w-full rounded border border-border bg-background px-3 py-2 text-sm">
              <option value="">Select customer</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {selectedCustomer && (
              <p className="text-xs text-muted-foreground">{selectedCustomer.email || "No email"} · {selectedCustomer.phone || "No phone"}</p>
            )}
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold">Job Details</h3>
            <label className="text-xs text-muted-foreground">Job Title *</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded border border-border bg-background px-3 py-2 text-sm" />
            <label className="text-xs text-muted-foreground">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded border border-border bg-background px-3 py-2 text-sm">
              <option>Scheduled</option>
              <option>In Progress</option>
              <option>Completed</option>
            </select>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold">Job Location</h3>
            <p className="text-[11px] text-muted-foreground">Fill each box. Street and city are required so the map can find the job.</p>
            <label className="text-xs text-muted-foreground">Street Address *</label>
            <input required value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} placeholder="123 Main St" className="w-full rounded border border-border bg-background px-3 py-2 text-sm" />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <label className="text-xs text-muted-foreground">City *</label>
                <input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Vancouver" className="w-full rounded border border-border bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Province</label>
                <input value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} placeholder="BC" className="w-full rounded border border-border bg-background px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <label className="text-xs text-muted-foreground">Postal Code</label>
                <input value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} placeholder="V6B 1A1" className="w-full rounded border border-border bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Country</label>
                <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="Canada" className="w-full rounded border border-border bg-background px-3 py-2 text-sm" />
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold">Schedule</h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <label className="text-xs text-muted-foreground">Start Date</label>
                <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full rounded border border-border bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">End Date</label>
                <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="w-full rounded border border-border bg-background px-3 py-2 text-sm" />
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold">Equipment and Assignments</h3>
            <label className="text-xs text-muted-foreground">Equipment</label>
            <select value={form.equipmentId} onChange={(e) => setForm({ ...form, equipmentId: e.target.value })} className="w-full rounded border border-border bg-background px-3 py-2 text-sm">
              <option value="">None</option>
              {equipment.map((eq) => <option key={eq.id} value={eq.id}>{eq.name} ({eq.unitNumber})</option>)}
            </select>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold">Notes</h3>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full rounded border border-border bg-background px-3 py-2 text-sm" rows={2} placeholder="Access instructions, timing notes…" />
          </section>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="rounded border border-border px-4 py-2 text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="rounded bg-accent px-4 py-2 text-sm text-accent-foreground disabled:opacity-50">
              {saving ? "Saving…" : editingId ? "Save Changes" : "Schedule Job"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!toComplete} onClose={() => setToComplete(null)} title="Complete Job">
        <div className="space-y-4">
          {completeError && <div className="rounded-lg bg-danger/15 px-3 py-2 text-sm text-danger">{completeError}</div>}
          <p className="text-sm text-muted-foreground">Record actual usage. Leave blank if unknown. Hours will be added to the equipment hour meter.</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Actual Hours</label>
              <input type="number" step="0.1" value={completeForm.actualHours} onChange={(e) => setCompleteForm({ ...completeForm, actualHours: e.target.value })} className="w-full rounded border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Attachment Hours</label>
              <input type="number" step="0.1" value={completeForm.actualAttachmentHours} onChange={(e) => setCompleteForm({ ...completeForm, actualAttachmentHours: e.target.value })} className="w-full rounded border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Driving Hours</label>
              <input type="number" step="0.1" value={completeForm.drivingHours} onChange={(e) => setCompleteForm({ ...completeForm, drivingHours: e.target.value })} className="w-full rounded border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Fuel Liters</label>
              <input type="number" step="0.1" value={completeForm.fuelLiters} onChange={(e) => setCompleteForm({ ...completeForm, fuelLiters: e.target.value })} className="w-full rounded border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Fuel Cost ($)</label>
              <input type="number" step="0.01" value={completeForm.fuelCost} onChange={(e) => setCompleteForm({ ...completeForm, fuelCost: e.target.value })} className="w-full rounded border border-border bg-background px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Completion Notes</label>
            <textarea value={completeForm.completionNotes} onChange={(e) => setCompleteForm({ ...completeForm, completionNotes: e.target.value })} className="w-full rounded border border-border bg-background px-3 py-2 text-sm" rows={2} />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setToComplete(null)} className="rounded border border-border px-4 py-2 text-sm">Cancel</button>
            <button type="button" onClick={handleComplete} disabled={completing} className="rounded bg-accent px-4 py-2 text-sm text-accent-foreground disabled:opacity-50">
              {completing ? "Saving…" : "Mark Completed"}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete job?"
        description={`Permanently delete "${toDelete?.title}"? This cannot be undone.`}
        confirmLabel="Delete Job"
        loading={deleting}
        error={deleteError}
        onClose={() => { if (!deleting) { setToDelete(null); setDeleteError(""); } }}
        onConfirm={async () => {
          if (!toDelete) return;
          setDeleting(true);
          setDeleteError("");
          const res = await fetch(`/api/jobs/${toDelete.id}`, { method: "DELETE" });
          setDeleting(false);
          if (res.ok) {
            setToDelete(null);
            load();
          } else {
            const data = await res.json();
            setDeleteError(data.error || "Could not delete");
          }
        }}
      />
    </div>
  );
}
