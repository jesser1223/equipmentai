"use client";

import { useState } from "react";

type EquipmentFormData = {
  name: string;
  category: string;
  make: string;
  model: string;
  year: string;
  unitNumber: string;
  serialNumber: string;
  description: string;
  hourlyRate: string;
  dailyRate: string;
  status: string;
  location: string;
  latitude: string;
  longitude: string;
  hourMeter: string;
  notes: string;
};

const empty: EquipmentFormData = {
  name: "",
  category: "Machine",
  make: "",
  model: "",
  year: "",
  unitNumber: "",
  serialNumber: "",
  description: "",
  hourlyRate: "",
  dailyRate: "",
  status: "Available",
  location: "",
  latitude: "",
  longitude: "",
  hourMeter: "",
  notes: "",
};

export function EquipmentForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<EquipmentFormData>;
  onSave: (data: EquipmentFormData) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<EquipmentFormData>({ ...empty, ...initial });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const update = (k: keyof EquipmentFormData, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.unitNumber.trim()) {
      setError("Name and Unit Number are required.");
      return;
    }
    setSaving(true);
    try {
      await onSave(form);
    } catch (err: any) {
      setError(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      {error && <div className="rounded-lg bg-danger/15 px-3 py-2 text-sm text-danger">{error}</div>}

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Equipment Details</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Equipment Name *" helper="Name used to identify this machine." value={form.name} onChange={(v) => update("name", v)} />
          <Field label="Unit Number *" helper="Your internal fleet ID." value={form.unitNumber} onChange={(v) => update("unitNumber", v)} />
          <Field label="Category" value={form.category} onChange={(v) => update("category", v)} />
          <Select label="Status" value={form.status} onChange={(v) => update("status", v)} options={["Available", "In Use", "Maintenance", "Inactive"]} />
          <Field label="Make" helper="Manufacturer." value={form.make} onChange={(v) => update("make", v)} />
          <Field label="Model" value={form.model} onChange={(v) => update("model", v)} />
          <Field label="Year" value={form.year} onChange={(v) => update("year", v)} type="number" />
          <Field label="Serial Number" value={form.serialNumber} onChange={(v) => update("serialNumber", v)} />
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Rates and Operating Info</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Hourly Rate ($/hour)" helper="Amount charged per operating hour." value={form.hourlyRate} onChange={(v) => update("hourlyRate", v)} type="number" />
          <Field label="Daily Rate ($/day)" helper="Amount charged per workday." value={form.dailyRate} onChange={(v) => update("dailyRate", v)} type="number" />
          <Field label="Location" value={form.location} onChange={(v) => update("location", v)} />
          <Field label="Hour Meter" helper="Total recorded machine hours." value={form.hourMeter} onChange={(v) => update("hourMeter", v)} type="number" />
          <Field label="Latitude" helper="Optional map coordinate." value={form.latitude} onChange={(v) => update("latitude", v)} type="number" />
          <Field label="Longitude" helper="Optional map coordinate." value={form.longitude} onChange={(v) => update("longitude", v)} type="number" />
        </div>
      </section>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Description / Notes</label>
        <p className="mb-1 text-[11px] text-muted-foreground">Internal notes for your team.</p>
        <textarea
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-white/5">
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Equipment"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  helper,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  helper?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
      {helper && <p className="mb-1 text-[11px] text-muted-foreground">{helper}</p>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
      />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
