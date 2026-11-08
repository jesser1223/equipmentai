const features = [
  ["Equipment and fleet management", "Keep each machine’s name, unit number, status, location, and hour meter in one list."],
  ["Equipment rates and attachments", "Set hourly, daily, and attachment rates, then use those rates on quotes and invoices."],
  ["Job scheduling and management", "Schedule jobs, assign equipment, and record actual hours when the work is finished."],
  ["Maintenance and service tracking", "Record service, see what is due soon or overdue, and keep the history with the machine."],
  ["Customer management", "Store customer details and keep their quotes, jobs, and invoices together."],
  ["Quotes and estimates", "Build a quote with equipment and attachment lines, then convert it to a job."],
  ["Invoicing and payment tracking", "Create invoice drafts, issue them, record partial or full payments, and see the balance."],
  ["Automated invoice sending and follow-ups", "Optionally email an invoice when it is issued, and send one overdue reminder when enabled."],
  ["Equipment documents", "Upload insurance, inspection, and ownership PDFs to the machine they belong to."],
];

export default function FeaturesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <h1 className="text-4xl font-semibold">Features</h1>
      <p className="mt-3 max-w-2xl text-white">The tools already in EquipmentAI, written for the way equipment contractors work.</p>
      <div className="mt-8 space-y-4">
        {features.map(([title, text]) => (
          <section key={title} className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-xl font-medium">{title}</h2>
            <p className="mt-2 text-sm text-white">{text}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
