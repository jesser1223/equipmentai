"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type Customer = { id: string; name: string };
type Equipment = { id: string; name: string; unitNumber: string; hourlyRate: number };
type Line = { equipmentId: string; description: string; quantity: number; rate: number; amount: number };

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [toDelete, setToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    const [q, c, e] = await Promise.all([
      fetch("/api/quotes").then((r) => r.json()),
      fetch("/api/customers").then((r) => r.json()),
      fetch("/api/equipment").then((r) => r.json()),
    ]);
    setQuotes(Array.isArray(q) ? q : []);
    setCustomers(Array.isArray(c) ? c : []);
    setEquipment(Array.isArray(e) ? e : []);
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Quotes</h1>
          <p className="text-sm text-muted-foreground">Create and manage customer quotes</p>
        </div>
        <button onClick={() => setOpen(true)} className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">
          <Plus className="h-4 w-4" /> Create Quote
        </button>
      </div>

      {toast && <div className="rounded-lg bg-emerald-500/15 px-4 py-2 text-sm text-emerald-400">{toast}</div>}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {quotes.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No quotes yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Number</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Job</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {quotes.map((q) => (
                <tr key={q.id} className="hover:bg-white/5">
                  <td className="px-4 py-3 font-medium">{q.number}</td>
                  <td className="px-4 py-3">{q.customer?.name}</td>
                  <td className="px-4 py-3">{q.jobName}</td>
                  <td className="px-4 py-3">{q.status}</td>
                  <td className="px-4 py-3">${q.total.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setToDelete(q)} className="text-muted-foreground hover:text-danger">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Create Quote">
        {/* Keep your existing QuoteForm here if you had one */}
        <p className="text-sm text-muted-foreground">Quote form goes here.</p>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete quote?"
        description={`Permanently delete quote ${toDelete?.number}? This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return;
          setDeleting(true);
          const res = await fetch(`/api/quotes/${toDelete.id}`, { method: "DELETE" });
          setDeleting(false);
          if (res.ok) {
            setToDelete(null);
            load();
          } else {
            const data = await res.json();
            alert(data.error || "Could not delete");
            setToDelete(null);
          }
        }}
      />
    </div>
  );
}