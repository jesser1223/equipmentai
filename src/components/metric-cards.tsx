"use client";

import { useEffect, useState } from "react";
import { Calendar, Truck, AlertTriangle, Receipt } from "lucide-react";

export function MetricCards() {
  const [metrics, setMetrics] = useState({
    equipmentAvailable: 0,
    maintenanceAlerts: 0,
    openQuotes: 0,
    unpaidInvoices: 0,
    jobsToday: 0,
    outstandingBalance: 0,
  });

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setMetrics)
      .catch(() => {});
  }, []);

  const items = [
    { label: "Equipment Available", value: metrics.equipmentAvailable, icon: Truck, change: "ready to assign" },
    { label: "Maintenance Alerts", value: metrics.maintenanceAlerts, icon: AlertTriangle, change: "needs attention", accent: true },
    { label: "Active Jobs", value: metrics.jobsToday, icon: Calendar, change: "scheduled" },
    { label: "Unpaid Invoices", value: metrics.unpaidInvoices, icon: Receipt, change: `$${metrics.outstandingBalance.toFixed(0)} outstanding` },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {items.map((m) => (
        <div
          key={m.label}
          className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-lg hover:shadow-black/20"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{m.label}</p>
              <p className="mt-2 text-3xl font-bold tracking-tight">{m.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{m.change}</p>
            </div>
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${m.accent ? "bg-danger/15 text-danger" : "bg-accent/15 text-accent"}`}>
              <m.icon className="h-5 w-5" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
