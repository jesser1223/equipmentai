import { sampleEquipment } from "@/data/sample";

const statusStyles: Record<string, string> = {
  "Checked Out": "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30",
  "Checked In": "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
  Maintenance: "bg-red-500/15 text-red-400 border border-red-500/30",
};

export function EquipmentTable() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h2 className="text-sm font-semibold">Equipment Status</h2>
        <span className="text-xs text-muted-foreground">4 assets shown</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <th className="px-6 py-3">Asset</th>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Last User</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Check Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sampleEquipment.map((eq) => (
              <tr key={eq.id} className="hover:bg-white/5">
                <td className="px-6 py-4 font-medium">{eq.name}</td>
                <td className="px-4 py-4 text-muted-foreground">{eq.id}</td>
                <td className="px-4 py-4">{eq.type}</td>
                <td className="px-4 py-4">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      statusStyles[eq.status] || "bg-muted/20"
                    }`}
                  >
                    {eq.status}
                  </span>
                </td>
                <td className="px-4 py-4">{eq.lastUser}</td>
                <td className="px-4 py-4">{eq.location}</td>
                <td className="px-4 py-4 text-muted-foreground">{eq.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
