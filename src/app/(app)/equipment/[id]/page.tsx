"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { EquipmentForm } from "@/components/equipment-form";

function money(n: number) {
  return `$${Number(n || 0).toFixed(2)}`;
}

function Field({ label, value }: { label: string; value: any }) {
  if (value == null || value === "") return null;
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm">{String(value)}</div>
    </div>
  );
}

export default function EquipmentProfilePage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [maintOpen, setMaintOpen] = useState(false);
  const [docOpen, setDocOpen] = useState(false);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docName, setDocName] = useState("");
  const [docCategory, setDocCategory] = useState("Other");
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = async () => {
    const res = await fetch(`/api/equipment/${params.id}/profile`);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(body.error || "Could not load equipment");
      return;
    }
    setData(body);
  };

  useEffect(() => {
    load();
  }, [params.id]);

  const saveEquipment = async (payload: any) => {
    const res = await fetch(`/api/equipment/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Could not save");
    }
    setEditing(false);
    load();
  };

  const recordMaintenance = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    const res = await fetch("/api/maintenance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        equipmentId: params.id,
        serviceDate: form.get("serviceDate"),
        category: form.get("category"),
        description: form.get("description"),
        hourMeterAtService: form.get("hourMeter") || null,
        partsCost: form.get("partsCost") || 0,
        labourCost: form.get("labourCost") || 0,
        otherCost: form.get("otherCost") || 0,
        notes: form.get("notes"),
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setMessage(body.error || "Could not record maintenance");
      return;
    }
    setMaintOpen(false);
    setMessage("Maintenance recorded");
    load();
  };

  const uploadDoc = async () => {
    if (!docFile || !docName.trim()) return;
    setBusy(true);
    const body = new FormData();
    body.set("name", docName.trim());
    body.set("category", docCategory);
    body.set("file", docFile);
    const res = await fetch(`/api/equipment/${params.id}/documents`, { method: "POST", body });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage(data.error || "Upload failed");
      return;
    }
    setDocOpen(false);
    setDocFile(null);
    setDocName("");
    setMessage("Document uploaded");
    load();
  };

  if (error) return <p className="text-sm text-red-400">{error}</p>;
  if (!data) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const eq = data;
  const nextService = eq.nextMaintenanceDue ? new Date(eq.nextMaintenanceDue) : null;
  const serviceWarning = nextService && nextService < new Date() ? "Overdue" : nextService ? "Scheduled" : null;

  return (
    <div className="space-y-6">
      <Link href="/equipment" className="text-sm text-accent">← Back to Equipment</Link>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="relative aspect-[16/9] bg-[#111827]">
          {eq.photoSource === "upload" ? (
            <img src={`/api/equipment/${eq.id}/photo`} alt={eq.name} className="absolute inset-0 h-full w-full object-contain" />
          ) : eq.photoUrl ? (
            <a href={eq.photoSourceUrl || eq.photoUrl} target="_blank" rel="noreferrer">
              <img src={eq.photoUrl} alt={eq.name} className="absolute inset-0 h-full w-full object-contain" />
            </a>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No equipment photo</div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0b0f19] via-[#0b0f19]/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-3 p-5">
            <div>
              <div className="mb-2 inline-flex rounded-full border border-white/20 bg-black/40 px-2.5 py-1 text-xs">{eq.status}</div>
              <h1 className="text-3xl font-semibold text-white">{eq.name}</h1>
              <p className="mt-1 text-sm text-white/80">
                {[eq.make, eq.model].filter(Boolean).join(" ")}
                {eq.year ? ` · ${eq.year}` : ""}
                {eq.unitNumber ? ` · Unit ${eq.unitNumber}` : ""}
              </p>
            </div>
            {eq.photoSource === "unsplash" && eq.photoPhotographer && (
              <p className="text-[11px] text-white/70">
                Photo by <a href={eq.photoPhotographerUrl} target="_blank" className="underline">{eq.photoPhotographer}</a> on <a href="https://unsplash.com/?utm_source=equipmentai&utm_medium=referral" target="_blank" className="underline">Unsplash</a>
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 border-t border-border px-5 py-3">
          <button onClick={() => setEditing(true)} className="rounded-lg border border-border px-3 py-2 text-sm">Edit Equipment</button>
          <button onClick={() => setMaintOpen(true)} className="rounded-lg border border-border px-3 py-2 text-sm">Record Maintenance</button>
          <button onClick={() => setDocOpen(true)} className="rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">Upload Document</button>
        </div>
      </div>

      {message && <p className="text-sm text-emerald-400">{message}</p>}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Status</div>
          <div className="mt-1 font-medium">{eq.status}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Operating hours</div>
          <div className="mt-1 font-medium">{eq.hourMeter != null ? eq.hourMeter.toLocaleString() : "Not recorded"}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Hourly / daily rate</div>
          <div className="mt-1 font-medium">{money(eq.hourlyRate)} / {money(eq.dailyRate)}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Total invoiced revenue</div>
          <div className="mt-1 font-medium">{money(eq.invoicedRevenue)}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Jobs</div>
          <div className="mt-1 font-medium">{eq.jobCount}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Maintenance</div>
          <div className="mt-1 font-medium">{serviceWarning || "No next service date"}</div>
        </div>
      </div>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-medium">Specifications</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Name" value={eq.name} />
          <Field label="Category" value={eq.category} />
          <Field label="Make" value={eq.make} />
          <Field label="Model" value={eq.model} />
          <Field label="Year" value={eq.year} />
          <Field label="Unit number" value={eq.unitNumber} />
          <Field label="Serial number" value={eq.serialNumber} />
          <Field label="Location" value={eq.location} />
          <Field label="Hour meter" value={eq.hourMeter} />
          <Field label="Hourly rate" value={money(eq.hourlyRate)} />
          <Field label="Daily rate" value={money(eq.dailyRate)} />
          <Field label="Maintenance interval (hours)" value={eq.maintenanceIntervalHours} />
          <Field label="Next service date" value={nextService ? nextService.toLocaleDateString() : null} />
          <Field label="Description" value={eq.description} />
          <Field label="Notes" value={eq.notes} />
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-medium">Attachments</h2>
        {eq.attachments?.length ? (
          <div className="mt-3 space-y-2 text-sm">
            {eq.attachments.map((a: any) => (
              <div key={a.id} className="flex justify-between rounded border border-border px-3 py-2">
                <span>{a.name}</span>
                <span className="text-muted-foreground">{a.billingMethod || "Rate"} · {money(a.rate)}</span>
              </div>
            ))}
          </div>
        ) : <p className="mt-2 text-sm text-muted-foreground">No attachments.</p>}
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-medium">Maintenance history</h2>
        {eq.maintenanceRecords?.length ? (
          <div className="mt-3 space-y-2 text-sm">
            {eq.maintenanceRecords.map((r: any) => (
              <div key={r.id} className="rounded border border-border px-3 py-2">
                <div className="flex justify-between gap-2">
                  <span>{r.category}</span>
                  <span>{new Date(r.serviceDate).toLocaleDateString()}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {r.description || "No description"}
                  {r.hourMeterAtService != null ? ` · ${r.hourMeterAtService} hrs` : ""}
                  {` · ${money(r.totalCost)}`}
                </div>
              </div>
            ))}
          </div>
        ) : <p className="mt-2 text-sm text-muted-foreground">No maintenance records.</p>}
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-medium">Documents</h2>
        {eq.documents?.length ? (
          <div className="mt-3 space-y-2 text-sm">
            {eq.documents.map((doc: any) => (
              <div key={doc.id} className="flex items-center justify-between rounded border border-border px-3 py-2">
                <div>
                  <div>{doc.name}</div>
                  <div className="text-xs text-muted-foreground">{doc.category} · {new Date(doc.createdAt).toLocaleDateString()}</div>
                </div>
                <a href={`/api/equipment/${eq.id}/documents/${doc.id}`} target="_blank" className="text-xs text-accent">View</a>
              </div>
            ))}
          </div>
        ) : <p className="mt-2 text-sm text-muted-foreground">No documents.</p>}
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-medium">Job history</h2>
        {eq.jobs?.length ? (
          <div className="mt-3 space-y-2 text-sm">
            {eq.jobs.map((job: any) => (
              <Link key={job.id} href="/schedule" className="block rounded border border-border px-3 py-2 hover:bg-white/5">
                <div className="flex justify-between gap-2">
                  <span>{job.title}</span>
                  <span>{job.status}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {job.customer?.name || "No customer"}
                  {job.startDate ? ` · ${new Date(job.startDate).toLocaleDateString()}` : ""}
                  {job.actualHours != null ? ` · ${job.actualHours} hrs` : ""}
                  {job.invoice ? ` · ${job.invoice.number} (${job.invoice.status})` : ""}
                </div>
              </Link>
            ))}
          </div>
        ) : <p className="mt-2 text-sm text-muted-foreground">No jobs.</p>}
      </section>

      <Modal open={editing} onClose={() => setEditing(false)} title="Edit Equipment">
        <EquipmentForm
          initial={eq}
          onSave={saveEquipment}
          onCancel={() => setEditing(false)}
        />
      </Modal>

      <Modal open={maintOpen} onClose={() => setMaintOpen(false)} title="Record Maintenance">
        <form onSubmit={recordMaintenance} className="space-y-3">
          <input name="serviceDate" type="date" required className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          <input name="category" placeholder="Category" required className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          <input name="description" placeholder="Description" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          <input name="hourMeter" type="number" step="0.1" placeholder="Hour meter" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          <input name="partsCost" type="number" step="0.01" placeholder="Parts cost" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          <input name="labourCost" type="number" step="0.01" placeholder="Labour cost" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          <input name="otherCost" type="number" step="0.01" placeholder="Other cost" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          <input name="notes" placeholder="Notes" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          <button disabled={busy} className="rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">{busy ? "Saving…" : "Save"}</button>
        </form>
      </Modal>

      <Modal open={docOpen} onClose={() => setDocOpen(false)} title="Upload Document">
        <div className="space-y-3">
          <input ref={fileRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => {
            const file = e.target.files?.[0] || null;
            setDocFile(file);
            if (file) setDocName(file.name.replace(/\.pdf$/i, ""));
          }} />
          <button type="button" onClick={() => fileRef.current?.click()} className="rounded-lg border border-border px-3 py-2 text-sm">Choose PDF</button>
          {docFile && <p className="text-sm">{docFile.name}</p>}
          <input value={docName} onChange={(e) => setDocName(e.target.value)} placeholder="Document name" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          <select value={docCategory} onChange={(e) => setDocCategory(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
            {["Insurance", "Pre-trip inspection", "Inspection report", "Maintenance record", "Ownership", "Safety certificate", "Operator manual", "Other"].map((c) => <option key={c}>{c}</option>)}
          </select>
          <button onClick={uploadDoc} disabled={busy || !docFile} className="rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground disabled:opacity-50">{busy ? "Uploading…" : "Upload"}</button>
        </div>
      </Modal>
    </div>
  );
}
