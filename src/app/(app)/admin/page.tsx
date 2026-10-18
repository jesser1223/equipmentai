"use client";

import { useEffect, useState } from "react";
import { Check, X, Pause, Play } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type Org = {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  users: { name: string; email: string }[];
  _count: { equipment: number };
};

export default function AdminPage() {
  const [data, setData] = useState<{ organizations: Org[]; counts: any } | null>(null);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<{ id: string; action: string } | null>(null);
  const [acting, setActing] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/organizations");
    if (res.ok) setData(await res.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const act = async () => {
    if (!pendingAction) return;
    setActing(true);
    await fetch(`/api/admin/organizations/${pendingAction.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: pendingAction.action }),
    });
    setActing(false);
    setPendingAction(null);
    load();
  };

  const orgs = (data?.organizations || []).filter((o) => {
    if (filter !== "all" && o.status.toLowerCase() !== filter) return false;
    if (query && !o.name.toLowerCase().includes(query.toLowerCase()) && !o.users[0]?.email?.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Super Admin</h1>

      {data && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card label="Pending" value={data.counts.pending} />
          <Card label="Approved" value={data.counts.approved} />
          <Card label="Denied" value={data.counts.denied} />
          <Card label="Total" value={data.counts.total} />
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search company or email"
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
        />
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="denied">Denied</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Equipment</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orgs.map((o) => (
                <tr key={o.id} className="hover:bg-white/5">
                  <td className="px-4 py-3 font-medium">{o.name}</td>
                  <td className="px-4 py-3">{o.users[0]?.name || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{o.users[0]?.email || "—"}</td>
                  <td className="px-4 py-3">{o.status}</td>
                  <td className="px-4 py-3">{o._count.equipment}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {o.status !== "Approved" && (
                        <button onClick={() => setPendingAction({ id: o.id, action: "approve" })} className="text-emerald-400" title="Approve"><Check className="h-4 w-4" /></button>
                      )}
                      {o.status !== "Denied" && (
                        <button onClick={() => setPendingAction({ id: o.id, action: "deny" })} className="text-danger" title="Deny"><X className="h-4 w-4" /></button>
                      )}
                      {o.status === "Approved" && (
                        <button onClick={() => setPendingAction({ id: o.id, action: "suspend" })} className="text-amber-400" title="Suspend"><Pause className="h-4 w-4" /></button>
                      )}
                      {o.status === "Suspended" && (
                        <button onClick={() => setPendingAction({ id: o.id, action: "restore" })} className="text-accent" title="Restore"><Play className="h-4 w-4" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmDialog
        open={!!pendingAction}
        onClose={() => !acting && setPendingAction(null)}
        onConfirm={act}
        title={`${pendingAction?.action === "approve" ? "Approve" : pendingAction?.action === "deny" ? "Deny" : pendingAction?.action === "suspend" ? "Suspend" : "Restore"} company?`}
        description={`This will ${pendingAction?.action} the selected company.`}
        confirmLabel={pendingAction?.action === "approve" ? "Approve" : pendingAction?.action === "deny" ? "Deny" : pendingAction?.action === "suspend" ? "Suspend" : "Restore"}
        loading={acting}
      />
    </div>
  );
}

function Card({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
