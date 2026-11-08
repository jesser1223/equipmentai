"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
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
  serviceStatus?: "Overdue" | "Due soon" | "Current" | "Not configured";
  hourMeter?: number | null;
  photoUrl?: string | null;
};

const statusStyles: Record<string, string> = {
  Available: "bg-emerald-500/15 text-emerald-400",
  "In Use": "bg-cyan-500/15 text-cyan-400",
  Maintenance: "bg-red-500/15 text-red-400",
  Inactive: "bg-slate-500/15 text-slate-400",
};

const serviceStyles: Record<string, string> = {
  Overdue: "bg-red-500/15 text-red-400",
  "Due soon": "bg-amber-500/15 text-amber-400",
  Current: "bg-emerald-500/15 text-emerald-400",
  "Not configured": "bg-slate-500/15 text-slate-400",
};

export default function EquipmentPage() {
  const [items, setItems] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [toast, setToast] = useState("");

  const [docTarget, setDocTarget] = useState<Equipment | null>(null);
  const [docs, setDocs] = useState<any[]>([]);
  const [docName, setDocName] = useState("");
  const [docCategory, setDocCategory] = useState("Other");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docError, setDocError] = useState("");
  const [docSuccess, setDocSuccess] = useState("");
  const [docBusy, setDocBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    const saved = await res.json();
    if (data.selectedPhotoId && saved.id) {
      await fetch(`/api/equipment/${saved.id}/photo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId: data.selectedPhotoId }),
      });
    }
    setModalOpen(false);
    setEditing(null);
    setToast(editing ? "Equipment updated" : "Equipment saved");
    setTimeout(() => setToast(""), 2500);
    load();
  };

  const openDocs = async (eq: Equipment) => {
    setDocTarget(eq);
    setDocError("");
    setDocSuccess("");
    setDocFile(null);
    const res = await fetch(`/api/equipment/${eq.id}/documents`);
    const data = await res.json().catch(() => []);
    setDocs(Array.isArray(data) ? data : []);
  };

  const chooseFile = (file: File | null) => {
    setDocError("");
    setDocSuccess("");
    if (!file) {
      setDocFile(null);
      return;
    }
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setDocFile(null);
      setDocError("Only PDF files are accepted.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setDocFile(null);
      setDocError("File must be 10 MB or smaller.");
      return;
    }
    setDocFile(file);
    setDocName(file.name.replace(/\.pdf$/i, ""));
  };

  const uploadDoc = async () => {
    if (!docTarget || !docFile || !docName.trim()) {
      setDocError("Name and PDF are required.");
      return;
    }
    setDocBusy(true);
    setDocError("");
    const body = new FormData();
    body.set("name", docName.trim());
    body.set("category", docCategory);
    body.set("file", docFile);
    const res = await fetch(`/api/equipment/${docTarget.id}/documents`, { method: "POST", body });
    const data = await res.json().catch(() => ({}));
    setDocBusy(false);
    if (!res.ok) {
      setDocError(data.error || "Upload failed");
      return;
    }
    setDocName("");
    setDocFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    await openDocs(docTarget);
    setDocSuccess("Document uploaded");
  };

  const removeDoc = async (docId: string) => {
    if (!docTarget) return;
    const res = await fetch(`/api/equipment/${docTarget.id}/documents/${docId}`, { method: "DELETE" });
    if (res.ok) openDocs(docTarget);
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
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Hour Meter</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Rates</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((eq) => (
                <tr
                  key={eq.id}
                  className="cursor-pointer hover:bg-white/5"
                  onClick={() => { window.location.href = `/equipment/${eq.id}`; }}
                >
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/equipment/${eq.id}`} className="flex items-center gap-2 hover:text-accent">
                      {eq.photoUrl ? <img src={eq.photoUrl} alt="" className="h-8 w-10 rounded object-cover" /> : null}
                      {eq.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{eq.unitNumber}</td>
                  <td className="px-4 py-3">{eq.category}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${statusStyles[eq.status] || ""}`}>
                      {eq.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${serviceStyles[eq.serviceStatus || "Not configured"] || ""}`}>
                      {eq.serviceStatus || "Not configured"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{eq.hourMeter != null ? eq.hourMeter.toLocaleString() : "—"}</td>
                  <td className="px-4 py-3">{eq.location || "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    ${eq.hourlyRate}/hr · ${eq.dailyRate}/day
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); openDocs(eq); }}
                        className="rounded-lg border border-accent/40 px-3 py-1.5 text-xs text-accent hover:bg-accent/10"
                      >
                        Documents
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
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
                        className="text-muted-foreground hover:text-danger"
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
          equipmentId={editing?.id}
          onSave={handleSave}
          onCancel={() => { setModalOpen(false); setEditing(null); }}
        />
      </Modal>

      <Modal open={!!docTarget} onClose={() => setDocTarget(null)} title={`Documents · ${docTarget?.name || ""}`}>
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => chooseFile(e.target.files?.[0] || null)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg border border-accent/40 px-3 py-2 text-sm text-accent hover:bg-accent/10"
          >
            Upload Document
          </button>
          {docFile && (
            <div className="space-y-2 rounded border border-border p-3">
              <div className="text-sm">{docFile.name}</div>
              <div className="text-xs text-muted-foreground">{(docFile.size / 1024).toFixed(0)} KB · PDF</div>
              <input value={docName} onChange={(e) => setDocName(e.target.value)} placeholder="Document name" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <select value={docCategory} onChange={(e) => setDocCategory(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                {["Insurance", "Pre-trip inspection", "Inspection report", "Maintenance record", "Ownership", "Safety certificate", "Operator manual", "Other"].map((c) => <option key={c}>{c}</option>)}
              </select>
              <button onClick={uploadDoc} disabled={docBusy} className="rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground disabled:opacity-50">
                {docBusy ? "Uploading…" : "Confirm upload"}
              </button>
            </div>
          )}
          {docError && <p className="text-sm text-red-400">{docError}</p>}
          {docSuccess && <p className="text-sm text-emerald-400">{docSuccess}</p>}
          {docs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No documents yet.</p>
          ) : (
            <div className="space-y-2">
              {docs.map((doc) => (
                <div key={doc.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-border px-3 py-2 text-sm">
                  <div>
                    <div>{doc.name} · PDF</div>
                    <div className="text-xs text-muted-foreground">{doc.category} · {new Date(doc.createdAt).toLocaleDateString()} · {(doc.size / 1024).toFixed(0)} KB</div>
                  </div>
                  <div className="flex gap-2">
                    <a href={`/api/equipment/${docTarget?.id}/documents/${doc.id}`} target="_blank" className="text-xs text-accent">View</a>
                    <button onClick={() => removeDoc(doc.id)} className="text-xs text-muted-foreground hover:text-danger">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
