"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/ui/modal";

export default function SchedulePage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    customerId: "",
    equipmentId: "",
    startDate: "",
    endDate: "",
    location: "",
    latitude: "",
    longitude: "",
    notes: "",
    status: "Scheduled",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");

  const load = async () => {
    const [j, c, e] = await Promise.all([
      fetch("/api/jobs").then((r) => r.json()),
      fetch("/api/customers").then((r) => r.json()),
      fetch("/api/equipment").then((r) => r.json()),
    ]);
    setJobs(Array.isArray(j) ? j : []);
    setCustomers(Array.isArray(c) ? c : []);
    setEquipment(Array.isArray(e) ? e : []);
  };

  useEffect(() => { load(); }, []);

  const selectedCustomer = customers.find((c) => c.id === form.customerId);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.title.trim() || !form.customerId) {
      setError("Job title and customer are required.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Could not schedule");
      return;
    }
    setShowForm(false);
    setForm({ title: "", description: "", customerId: "", equipmentId: "", startDate: "", endDate: "", location: "", latitude: "", longitude: "", notes: "", status: "Scheduled" });
    load();
  };

  const filtered = jobs.filter((j) => filterStatus === "all" || j.status === filterStatus);
  const upcoming = jobs.filter((j) => j.status === "Scheduled").length;
  const active = jobs.filter((j) => j.status === "In Progress").length;
  const completed = jobs.filter((j) => j.status === "Completed").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Schedule</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">
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
              <div key={j.id} className="rounded-xl border border-border bg-card p-4">
                <div className="font-medium">{j.title}</div>
                <div className="text-sm text-muted-foreground">{j.customer?.name || "No customer"} · {j.location || "No job-site address"}</div>
                <div className="text-xs text-muted-foreground">{j.startDate ? new Date(j.startDate).toLocaleDateString() : "Unscheduled"} · {j.status}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Schedule a Job">
        <form onSubmit={create} className="max-h-[70vh] space-y-5 overflow-y-auto pr-1">
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
            <label className="text-xs text-muted-foreground">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded border border-border bg-background px-3 py-2 text-sm" rows={2} />
            <label className="text-xs text-muted-foreground">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded border border-border bg-background px-3 py-2 text-sm">
              <option>Scheduled</option>
              <option>In Progress</option>
              <option>Completed</option>
            </select>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold">Job Location</h3>
            <p className="text-[11px] text-muted-foreground">Job-site address (not the billing address or equipment location).</p>
            <label className="text-xs text-muted-foreground">Job-site Address</label>
            <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full rounded border border-border bg-background px-3 py-2 text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">Latitude (optional)</label>
                <input type="number" step="any" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} className="w-full rounded border border-border bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Longitude (optional)</label>
                <input type="number" step="any" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} className="w-full rounded border border-border bg-background px-3 py-2 text-sm" />
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
            <button type="button" onClick={() => setShowForm(false)} className="rounded border border-border px-4 py-2 text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="rounded bg-accent px-4 py-2 text-sm text-accent-foreground disabled:opacity-50">
              {saving ? "Scheduling…" : "Schedule Job"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
