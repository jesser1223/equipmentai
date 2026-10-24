"use client";

import { useEffect, useState } from "react";

export default function UtilizationPage() {
  const [data, setData] = useState<any>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const res = await fetch(`/api/utilization?${params}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Equipment Utilization</h1>
        <p className="text-sm text-muted-foreground">Total recorded actual hours from completed jobs. Available hours are not estimated.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded border border-border bg-card px-3 py-2 text-sm" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded border border-border bg-card px-3 py-2 text-sm" />
        <button onClick={load} className="rounded bg-accent px-4 py-2 text-sm text-accent-foreground">Filter</button>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : !data?.equipment?.length ? (
        <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">No completed jobs with recorded hours in this range.</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Equipment</th>
                <th className="px-4 py-3">Unit #</th>
                <th className="px-4 py-3 text-right">Jobs</th>
                <th className="px-4 py-3 text-right">Total Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.equipment.map((eq: any) => (
                <tr key={eq.id}>
                  <td className="px-4 py-3">{eq.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{eq.unitNumber}</td>
                  <td className="px-4 py-3 text-right">{eq.jobCount}</td>
                  <td className="px-4 py-3 text-right">{eq.totalHours.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data?.note && <p className="text-xs text-muted-foreground">{data.note}</p>}
    </div>
  );
}
