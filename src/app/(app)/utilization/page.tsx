"use client";

import { useEffect, useState } from "react";

const presets = [
  { id: "today", label: "Today" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
  { id: "30", label: "Last 30 Days" },
  { id: "quarter", label: "This Quarter" },
  { id: "year", label: "This Year" },
];

function rangeFor(preset: string) {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);
  if (preset === "today") {
    start.setHours(0, 0, 0, 0);
  } else if (preset === "week") {
    const day = start.getDay();
    start.setDate(start.getDate() - day);
    start.setHours(0, 0, 0, 0);
  } else if (preset === "month") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  } else if (preset === "30") {
    start.setDate(start.getDate() - 30);
  } else if (preset === "quarter") {
    const q = Math.floor(start.getMonth() / 3) * 3;
    start.setMonth(q, 1);
    start.setHours(0, 0, 0, 0);
  } else if (preset === "year") {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
  }
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { from: fmt(start), to: fmt(end) };
}

export default function UtilizationPage() {
  const [data, setData] = useState<any>(null);
  const [equipmentList, setEquipmentList] = useState<any[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [preset, setPreset] = useState("");
  const [equipmentId, setEquipmentId] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<"hours" | "jobs" | "name">("hours");

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (equipmentId) params.set("equipmentId", equipmentId);
    if (search) params.set("search", search);
    const res = await fetch(`/api/utilization?${params}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  };

  useEffect(() => {
    fetch("/api/equipment").then((r) => r.json()).then((d) => setEquipmentList(Array.isArray(d) ? d : []));
    load();
  }, []);

  const applyPreset = (id: string) => {
    setPreset(id);
    const r = rangeFor(id);
    setFrom(r.from);
    setTo(r.to);
  };

  const reset = () => {
    setPreset("");
    setFrom("");
    setTo("");
    setEquipmentId("");
    setSearch("");
  };

  const rows = [...(data?.equipment || [])].sort((a, b) => {
    if (sort === "name") return a.name.localeCompare(b.name);
    if (sort === "jobs") return b.jobCount - a.jobCount;
    return b.totalHours - a.totalHours;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Equipment Utilization</h1>
        <p className="text-sm text-muted-foreground">Machine hours include equipment hours plus attachment hours used on that machine. Attachments are listed under the equipment.</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <button key={p.id} onClick={() => applyPreset(p.id)} className={`rounded-full px-3 py-1 text-xs ${preset === p.id ? "bg-accent text-accent-foreground" : "border border-border"}`}>
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPreset(""); }} className="rounded border border-border bg-background px-3 py-2 text-sm" />
          <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPreset(""); }} className="rounded border border-border bg-background px-3 py-2 text-sm" />
          <select value={equipmentId} onChange={(e) => setEquipmentId(e.target.value)} className="rounded border border-border bg-background px-3 py-2 text-sm">
            <option value="">All equipment</option>
            {equipmentList.map((eq) => <option key={eq.id} value={eq.id}>{eq.name} ({eq.unitNumber})</option>)}
          </select>
          <input placeholder="Search name…" value={search} onChange={(e) => setSearch(e.target.value)} className="rounded border border-border bg-background px-3 py-2 text-sm" />
          <button onClick={load} className="rounded bg-accent px-4 py-2 text-sm text-accent-foreground">Apply</button>
          <button onClick={reset} className="rounded border border-border px-3 py-2 text-sm">Reset</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4"><div className="text-2xl font-semibold">{data?.totalHours ?? 0}</div><div className="text-xs text-muted-foreground">Operating hours</div></div>
        <div className="rounded-xl border border-border bg-card p-4"><div className="text-2xl font-semibold">{data?.totalJobs ?? 0}</div><div className="text-xs text-muted-foreground">Jobs</div></div>
        <div className="rounded-xl border border-border bg-card p-4"><div className="text-2xl font-semibold">{data?.equipmentCount ?? 0}</div><div className="text-xs text-muted-foreground">Machines</div></div>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">No completed jobs with recorded hours for these filters.</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 cursor-pointer" onClick={() => setSort("name")}>Equipment</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 text-right cursor-pointer" onClick={() => setSort("jobs")}>Jobs</th>
                <th className="px-4 py-3 text-right cursor-pointer" onClick={() => setSort("hours")}>Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((eq: any) => (
                <>
                  <tr key={eq.id}>
                    <td className="px-4 py-3 font-medium">{eq.name} <span className="text-muted-foreground">({eq.unitNumber})</span></td>
                    <td className="px-4 py-3 text-muted-foreground">{eq.type || "—"}</td>
                    <td className="px-4 py-3 text-right">{eq.jobCount}</td>
                    <td className="px-4 py-3 text-right">{eq.totalHours.toFixed(1)}</td>
                  </tr>
                  {(eq.attachments || []).map((a: any) => (
                    <tr key={a.id} className="bg-background/40">
                      <td className="px-4 py-2 pl-8 text-sm text-muted-foreground">↳ {a.name}</td>
                      <td className="px-4 py-2"></td>
                      <td className="px-4 py-2 text-right text-sm text-muted-foreground">{a.jobCount}</td>
                      <td className="px-4 py-2 text-right text-sm text-muted-foreground">{a.totalHours.toFixed(1)}</td>
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data?.note && <p className="text-xs text-muted-foreground">{data.note}</p>}
    </div>
  );
}
