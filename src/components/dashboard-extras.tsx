"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function DashboardExtras() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data) return null;

  return (
    <div className="space-y-4">
      {data.todayJobs?.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-2 text-sm font-semibold">Today’s Jobs</h3>
          <div className="space-y-2">
            {data.todayJobs.map((j: any) => (
              <Link key={j.id} href="/schedule" className="block rounded-lg border border-border/60 p-2 text-sm hover:bg-white/5">
                <div className="font-medium">{j.title}</div>
                <div className="text-xs text-muted-foreground">
                  {j.customer || "No customer"} · {j.equipment || "Unassigned"} · {j.status}
                </div>
                {j.location && <div className="text-xs text-muted-foreground">{j.location}</div>}
              </Link>
            ))}
          </div>
        </div>
      )}

      {data.attention?.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-2 text-sm font-semibold">Attention Required</h3>
          <div className="space-y-1">
            {data.attention.map((a: any, i: number) => (
              <Link key={i} href={a.href} className="block text-sm text-amber-400 hover:underline">
                {a.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {data.recentActivity?.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-2 text-sm font-semibold">Recent Activity</h3>
          <div className="space-y-1 text-xs text-muted-foreground">
            {data.recentActivity.map((a: any, i: number) => (
              <div key={i}>{a.label}</div>
            ))}
          </div>
          {data.note && <p className="mt-2 text-[10px] text-muted-foreground/70">{data.note}</p>}
        </div>
      )}
    </div>
  );
}
