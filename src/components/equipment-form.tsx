"use client";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type Attachment = {
  name: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  billingMethod: string;
  rate: string;
  notes: string;
};

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
  attachments: Attachment[];
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
  attachments: [],
};

export function EquipmentForm({
  initial,
  equipmentId,
  onSave,
  onCancel,
}: {
  initial?: Partial<EquipmentFormData>;
  equipmentId?: string;
  onSave: (data: EquipmentFormData & { selectedPhotoId?: string }) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<EquipmentFormData>({ ...empty, ...initial });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [preview, setPreview] = useState(initial && (initial as any).photoUrl ? (initial as any).photoUrl : "");
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [removing, setRemoving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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
      await onSave({ ...form, selectedPhotoId: selected?.id });
    } catch (err: any) {
      setError(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const findPhotos = async () => {
    if (!form.make.trim() || !form.model.trim()) {
      setError("Enter the manufacturer and model before searching.");
      return;
    }
    setSearching(true);
    setError("");
    const res = await fetch(`/api/equipment/photo-search?make=${encodeURIComponent(form.make)}&model=${encodeURIComponent(form.model)}`);
    const data = await res.json().catch(() => ({}));
    setSearching(false);
    if (!res.ok) {
      setError(data.error || "Photo search failed");
      return;
    }
    setResults(data.results || []);
  };

  const removePhoto = async () => {
    if (removing) return;
    setRemoving(true);
    setSelected(null);
    setPreview("");
    if (equipmentId) await fetch(`/api/equipment/${equipmentId}/photo`, { method: "DELETE" });
    setRemoving(false);
    setConfirmRemove(false);
  };

  const uploadOwn = async (file: File | null) => {
    if (!file || !equipmentId) return;
    const body = new FormData();
    body.set("file", file);
    const res = await fetch(`/api/equipment/${equipmentId}/photo`, { method: "PUT", body });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Upload failed");
      return;
    }
    setPreview(`/api/equipment/${equipmentId}/photo?t=${Date.now()}`);
    setSelected(null);
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      {error && <div className="rounded-lg bg-danger/15 px-3 py-2 text-sm text-danger">{error}</div>}
      <section className="rounded-xl border border-border p-4">
        <h3 className="text-sm font-medium">Equipment Photo</h3>
        <div className="mt-3 flex flex-wrap items-start gap-4">
          <div className="h-28 w-40 overflow-hidden rounded-lg border border-border bg-background">
            {preview || selected ? (
              <img src={selected?.previewUrl || preview} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No photo</div>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={findPhotos} className="rounded-lg border border-border px-3 py-2 text-xs">{searching ? "Searching…" : "Find Photos"}</button>
              <button type="button" onClick={() => fileRef.current?.click()} className="rounded-lg border border-border px-3 py-2 text-xs" disabled={!equipmentId}>Upload Photo</button>
              <button type="button" onClick={() => setConfirmRemove(true)} className="rounded-lg border border-border px-3 py-2 text-xs">Remove Photo</button>
            </div>
            {!equipmentId && <p className="text-xs text-muted-foreground">Save the equipment first to upload your own photo.</p>}
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => uploadOwn(e.target.files?.[0] || null)} />
          </div>
        </div>
        {results.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {results.map((p) => (
              <button type="button" key={p.id} onClick={() => setSelected(p)} className={`overflow-hidden rounded-lg border text-left ${selected?.id === p.id ? "border-accent" : "border-border"}`}>
                <img src={p.previewUrl} alt="" className="h-24 w-full object-cover" />
                <div className="px-2 py-1 text-[11px] text-muted-foreground">
                  Photo by <a href={p.photographerUrl} target="_blank" className="underline">{p.photographer}</a> on Unsplash
                </div>
              </button>
            ))}
          </div>
        )}
        {selected && <p className="mt-2 text-xs text-muted-foreground">Selected. Save the equipment to keep this photo.</p>}
      </section>
      <ConfirmDialog
        open={confirmRemove}
        onClose={() => { if (!removing) setConfirmRemove(false); }}
        onConfirm={removePhoto}
        title="Remove equipment photo?"
        description="This removes the photo from this equipment. Unsplash photos are only unlinked. Uploaded photos are deleted from storage."
        confirmLabel="Remove Photo"
        loading={removing}
      />

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
          <Field label="Notes" value={form.notes} onChange={(v) => update("notes", v)} />
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

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Attachments</h3>
          <button
            type="button"
            onClick={() =>
              setForm((f) => ({
                ...f,
                attachments: [
                  ...f.attachments,
                  { name: "", manufacturer: "", model: "", serialNumber: "", billingMethod: "hourly", rate: "0", notes: "" },
                ],
              }))
            }
            className="text-xs text-accent"
          >
            + Add Attachment
          </button>
        </div>
        {form.attachments.length === 0 && (
          <p className="text-xs text-muted-foreground">No attachments yet. Add buckets, breakers, or other tools that bill with this machine.</p>
        )}
        {form.attachments.map((att, i) => (
          <div key={i} className="space-y-2 rounded-lg border border-border p-3">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input
                placeholder="Attachment name *"
                value={att.name}
                onChange={(e) => {
                  const next = [...form.attachments];
                  next[i].name = e.target.value;
                  setForm({ ...form, attachments: next });
                }}
                className="rounded border border-border bg-background px-2 py-1 text-sm"
              />
              <select
                value={att.billingMethod}
                onChange={(e) => {
                  const next = [...form.attachments];
                  next[i].billingMethod = e.target.value;
                  setForm({ ...form, attachments: next });
                }}
                className="rounded border border-border bg-background px-2 py-1 text-sm"
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="per-job">Per Job</option>
              </select>
              <input
                type="number"
                step="0.01"
                placeholder="Rate"
                value={att.rate}
                onChange={(e) => {
                  const next = [...form.attachments];
                  next[i].rate = e.target.value;
                  setForm({ ...form, attachments: next });
                }}
                className="rounded border border-border bg-background px-2 py-1 text-sm"
              />
              <input
                placeholder="Notes"
                value={att.notes}
                onChange={(e) => {
                  const next = [...form.attachments];
                  next[i].notes = e.target.value;
                  setForm({ ...form, attachments: next });
                }}
                className="rounded border border-border bg-background px-2 py-1 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, attachments: form.attachments.filter((_, idx) => idx !== i) })}
              className="text-xs text-muted-foreground hover:text-danger"
            >
              Remove
            </button>
          </div>
        ))}
      </section>

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
