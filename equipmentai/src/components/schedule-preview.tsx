"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function SchedulePreview() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/jobs")
      .then((r) => r.json())
      .then((data) => setJobs(Array.isArray(data) ? data.slice(0, 5) : []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Upcoming Jobs</h2>
        <Link href="/schedule" className="text-xs text-accent">View schedule →</Link>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : jobs.length === 0 ? (
        <div className="text-sm text-muted-foreground">No scheduled jobs.</div>
      ) : (
        <div className="space-y-2">
          {jobs.map((job) => (
            <div key={job.id} className="rounded-lg border border-border p-3">
              <div className="text-sm font-medium">{job.title}</div>
              <div className="text-xs text-muted-foreground">
                {job.customer?.name || "No customer"} · {job.startDate ? new Date(job.startDate).toLocaleDateString() : "Unscheduled"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
