import { sampleJobs } from "@/data/sample";

export function SchedulePreview() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Upcoming Jobs</h2>
        <span className="text-xs text-accent">View schedule →</span>
      </div>

      <div className="space-y-2">
        {sampleJobs.map((job, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 rounded-lg p-3 ${job.color} bg-opacity-90`}
          >
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white">{job.time}</div>
              <div className="truncate text-sm font-medium text-white">
                {job.client}
              </div>
              <div className="text-xs text-white/80">{job.job}</div>
            </div>
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-[10px] font-medium text-white">
              {job.tech.split(" ")[0][0]}
              {job.tech.split(" ")[1]?.[0]}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
