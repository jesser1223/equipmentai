"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [toDelete, setToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const load = async () => {
    const res = await fetch("/api/customers");
    const data = await res.json();
    setCustomers(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setName("");
    load();
  };

  const remove = async () => {
    if (!toDelete) return;
    setDeleting(true);
    setError("");
    const res = await fetch(`/api/customers/${toDelete.id}`, { method: "DELETE" });
    const data = await res.json();
    setDeleting(false);
    if (!res.ok) {
      setError(data.error || "Could not delete");
      return;
    }
    setToDelete(null);
    setToast("Customer deleted");
    setTimeout(() => setToast(""), 2500);
    load();
  };

  const linked = toDelete?._count || { quotes: 0, jobs: 0, invoices: 0 };
  const attached = [
    linked.quotes ? `${linked.quotes} quote${linked.quotes === 1 ? "" : "s"}` : "",
    linked.jobs ? `${linked.jobs} job${linked.jobs === 1 ? "" : "s"}` : "",
    linked.invoices ? `${linked.invoices} invoice${linked.invoices === 1 ? "" : "s"}` : "",
  ].filter(Boolean);
  const description = !toDelete
    ? ""
    : attached.length
      ? `Are you sure you want to delete “${toDelete.name}”? This will also permanently delete the ${attached.join(", ")} attached to this customer. This cannot be undone.`
      : `Are you sure you want to permanently delete “${toDelete.name}”? This cannot be undone.`;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Customers</h1>
      {toast && <div className="rounded-lg bg-emerald-500/15 px-4 py-2 text-sm text-emerald-400">{toast}</div>}

      <form onSubmit={add} className="flex max-w-md gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Customer name"
          className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm"
        />
        <button className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">Add</button>
      </form>

      <div className="rounded-xl border border-border bg-card">
        {loading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading…</div>
        ) : customers.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">No customers yet.</div>
        ) : (
          <ul className="divide-y divide-border">
            {customers.map((c) => (
              <li key={c.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span>{c.name}</span>
                <button onClick={() => { setError(""); setToDelete(c); }} className="text-muted-foreground hover:text-danger" aria-label={`Delete ${c.name}`}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => !deleting && setToDelete(null)}
        onConfirm={remove}
        title="Delete customer?"
        description={description}
        confirmLabel="Delete Customer"
        loading={deleting}
        error={error}
      />
    </div>
  );
}
