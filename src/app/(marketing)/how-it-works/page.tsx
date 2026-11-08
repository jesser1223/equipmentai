const steps = [
  ["Set up your company", "Create the account, confirm the company, and open the dashboard."],
  ["Add equipment, rates and customers", "Enter machines, hourly and daily rates, attachments, and the customers you work for."],
  ["Create and schedule jobs", "Put the work on the schedule and assign the equipment."],
  ["Track equipment usage and completed work", "Record actual hours and attachments when the job is completed."],
  ["Generate quotes and invoices", "Quote the work, then create an invoice draft from the completed job."],
  ["Track payments and follow-ups", "Record payments, send a receipt, and use overdue reminders when you turn them on."],
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <h1 className="text-4xl font-semibold">How It Works</h1>
      <p className="mt-3 max-w-2xl text-white">A typical path from setup to getting paid.</p>
      <ol className="mt-8 space-y-4">
        {steps.map(([title, text], i) => (
          <li key={title} className="flex gap-4 rounded-2xl border border-border bg-card p-6">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">{i + 1}</div>
            <div>
              <h2 className="text-lg font-medium">{title}</h2>
              <p className="mt-1 text-sm text-white">{text}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
