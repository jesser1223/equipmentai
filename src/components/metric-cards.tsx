"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Truck, AlertTriangle, Receipt, MapPin, Clock } from "lucide-react";

export function MetricCards() {
  const [metrics, setMetrics] = useState<any>({});
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setMetrics)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, []);

  const items = [
    { label: "Active Jobs", value: metrics.activeJobs ?? 0, href: "/schedule", icon: Calendar, sub: "scheduled or in progress" },
    { label: "Today", value: metrics.jobsToday ?? 0, href: "/schedule", icon: Clock, sub: "jobs scheduled today" },
    { label: "Need Equipment", value: metrics.unassignedJobs ?? 0, href: "/schedule", icon: MapPin, sub: "unassigned", accent: (metrics.unassignedJobs || 0) > 0 },
    { label: "Available Equipment", value: metrics.equipmentAvailable ?? 0, href: "/equipment", icon: Truck, sub: "ready to assign" },
    { label: "Maintenance", value: (metrics.overdueMaintenance || 0) + (metrics.dueSoonMaintenance || 0), href: "/equipment", icon: AlertTriangle, sub: `${metrics.overdueMaintenance || 0} overdue · ${metrics.dueSoonMaintenance || 0} soon`, accent: (metrics.overdueMaintenance || 0) > 0 },
    { label: "Outstanding", value: `$${Number(metrics.outstandingBalance || 0).toFixed(0)}`, href: "/invoices", icon: Receipt, sub: `${metrics.unpaidInvoices || 0} unpaid invoices` },
  ];

  if (loading) {
    return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{items.map((m) => <div key={m.label} className="h-24 animate-pulse rounded-xl border border-border bg-card" />)}</div>;
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map((m) => (
        <Link
          key={m.label}
          href={m.href}
          className="rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-lg hover:shadow-black/20"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{m.label}</p>
              <p className="mt-1 text-2xl font-bold tracking-tight">{m.value}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{m.sub}</p>
            </div>
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${m.accent ? "bg-danger/15 text-danger" : "bg-accent/15 text-accent"}`}>
              <m.icon className="h-4 w-4" />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
