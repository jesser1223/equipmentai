"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

export default function SchedulePage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", customerId: "", equipmentId: "", startDate: "", endDate: "", location: "" });
  const [error, setError] = useState("");

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

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Could not schedule");
      return;
    }
    setShowForm(false);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Schedule</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">
          <Plus className="h-4 w-4" /> Schedule Job
        </button>
      </div>

      {showForm && (
        <form onSubmit={create} className="space-y-3 rounded-xl border border-border bg-card p-4">
          {error && <div className="rounded-lg bg-danger/15 px-3 py-2 text-sm text-danger">{error}</div>}
          <input required placeholder="Job title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          <select required value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
            <option value="">Customer</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={form.equipmentId} onChange={(e) => setForm({ ...form, equipmentId: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
            <option value="">Equipment (optional)</option>
            {equipment.map((eq) => <option key={eq.id} value={eq.id}>{eq.name}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <input type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <input type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          </div>
          <input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          <div className="flex gap-2">
            <button type="submit" className="rounded-lg bg-accent px-4 py-2 text-sm text-accent-foreground">Save</button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-border px-4 py-2 text-sm">Cancel</button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {jobs.length === 0 && <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">No scheduled jobs.</div>}
        {jobs.map((job) => (
          <div key={job.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div className="font-medium">{job.title}</div>
              <div className="text-xs text-muted-foreground">{job.status}</div>
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              {job.customer?.name} · {job.equipment?.name || "No equipment"} · {job.startDate ? new Date(job.startDate).toLocaleString() : "Unscheduled"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
