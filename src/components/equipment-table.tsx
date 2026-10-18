"use client";

import { useEffect, useState } from "react";

const statusStyles: Record<string, string> = {
  Available: "bg-emerald-500/15 text-emerald-400",
  "In Use": "bg-cyan-500/15 text-cyan-400",
  Maintenance: "bg-red-500/15 text-red-400",
  Inactive: "bg-slate-500/15 text-slate-400",
};

export function EquipmentTable() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/equipment")
      .then((r) => r.json())
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h2 className="text-sm font-semibold">Equipment Status</h2>
        <span className="text-xs text-muted-foreground">{items.length} assets</span>
      </div>

      {loading ? (
        <div className="p-6 text-sm text-muted-foreground">Loading…</div>
      ) : items.length === 0 ? (
        <div className="p-6 text-sm text-muted-foreground">No equipment yet. Add some from the Equipment page.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <th className="px-6 py-3">Asset</th>
                <th className="px-4 py-3">Unit</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((eq) => (
                <tr key={eq.id} className="hover:bg-white/5">
                  <td className="px-6 py-3 font-medium">{eq.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{eq.unitNumber}</td>
                  <td className="px-4 py-3">{eq.category}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${statusStyles[eq.status] || ""}`}>{eq.status}</span>
                  </td>
                  <td className="px-4 py-3">{eq.location || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
