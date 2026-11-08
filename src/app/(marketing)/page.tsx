import Link from "next/link";

const areas = [
  ["Equipment management", "Track machines, rates, status, and documents."],
  ["Job scheduling", "Plan work and record what was actually completed."],
  ["Customers", "Keep customer details with the jobs and invoices they belong to."],
  ["Quotes and invoicing", "Quote the work, then invoice from the same rates."],
  ["Maintenance", "See service history and what is due."],
  ["Payments", "Record payments and send receipts."],
];

function Preview({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between text-xs text-white">
        <span>{title}</span>
        <span className="rounded bg-accent/15 px-2 py-0.5 text-accent">EquipmentAI</span>
      </div>
      <div className="space-y-2">
        {lines.map((line) => (
          <div key={line} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">{line}</div>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_40%,rgba(34,211,238,0.18),transparent_42%)]" />
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <div className="relative z-10">
            <p className="text-sm font-medium text-accent">EquipmentAI</p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight md:text-5xl">Run Your Equipment Business. All in One Place.</h1>
            <p className="mt-4 text-lg text-white">Manage equipment, schedule jobs, track maintenance, create quotes and send invoices — all from one simple platform built for equipment contractors.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/signup" className="rounded-lg bg-accent px-5 py-3 text-sm font-medium text-accent-foreground hover:opacity-90">Start Your Free Trial</Link>
              <Link href="/features" className="rounded-lg border border-border px-5 py-3 text-sm hover:bg-white/5">Explore Features</Link>
            </div>
          </div>
          <div className="relative min-h-[320px] md:min-h-[420px]">
            <div className="absolute inset-0 rounded-[2rem] bg-accent/10 blur-3xl" />
            <img
              src="/hero-excavator.jpg"
              alt="Excavator working at a construction site at night"
              className="absolute inset-0 h-full w-full rounded-[2rem] object-cover opacity-80 [mask-image:radial-gradient(ellipse_at_center,black_45%,transparent_78%)]"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-[#0b0f19]/80" />
            <div className="relative z-10 flex h-full items-end p-4 md:p-6">
              <div className="w-full max-w-sm shadow-2xl shadow-black/40">
                <Preview title="Dashboard" lines={["3 jobs scheduled today", "Excavator available · $150/hr", "Invoice INV-1042 outstanding", "1 service due soon"]} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-card/40">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-2xl font-semibold">What EquipmentAI helps you manage</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {areas.map(([title, text]) => (
              <div key={title} className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-medium">{title}</h3>
                <p className="mt-2 text-sm text-white">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl space-y-10 px-4 py-14">
        <div className="grid items-center gap-6 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold">Equipment management</h2>
            <p className="mt-2 text-white">Keep each machine’s rates, status, location, hour meter, and documents together.</p>
          </div>
          <Preview title="Equipment" lines={["Excavator · Available", "Rate $150/hr · $900/day", "Hour meter 4,280", "Insurance certificate"]} />
        </div>
        <div className="grid items-center gap-6 md:grid-cols-2">
          <Preview title="Schedule" lines={["Site prep · 8:00", "Excavator assigned", "Customer: North Lot", "Status: Scheduled"]} />
          <div>
            <h2 className="text-2xl font-semibold">Job scheduling</h2>
            <p className="mt-2 text-white">Schedule the work, assign the machine, and record actual hours when the job is done.</p>
          </div>
        </div>
        <div className="grid items-center gap-6 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold">Invoicing</h2>
            <p className="mt-2 text-white">Turn completed work into an invoice draft, issue it, and record payments.</p>
          </div>
          <Preview title="Invoice" lines={["INV-1042 · Issued", "Equipment $900", "GST included", "Balance $945"]} />
        </div>
        <div className="grid items-center gap-6 md:grid-cols-2">
          <Preview title="Maintenance" lines={["Service due soon", "Last service 4,100 hrs", "Oil and filters", "Record saved"]} />
          <div>
            <h2 className="text-2xl font-semibold">Maintenance tracking</h2>
            <p className="mt-2 text-white">See what is due and keep a history of service on each machine.</p>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-card/40">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-2xl font-semibold">How it works</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {["Add your equipment and customers.", "Schedule and manage your jobs.", "Track work, send invoices and manage payments."].map((step, i) => (
              <div key={step} className="rounded-xl border border-border bg-card p-5">
                <div className="text-sm text-accent">0{i + 1}</div>
                <p className="mt-2">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-2xl font-semibold">Why EquipmentAI</h2>
        <ul className="mt-4 grid gap-3 text-sm text-white sm:grid-cols-2">
          {["Less paperwork.", "Better organization.", "Easier job tracking.", "Improved equipment visibility.", "Simplified invoicing.", "Less time on administrative work."].map((item) => (
            <li key={item} className="rounded-lg border border-border bg-card px-4 py-3">{item}</li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="rounded-2xl border border-border bg-card px-6 py-10 text-center">
          <h2 className="text-2xl font-semibold">Spend Less Time Managing Paperwork. More Time Running Your Business.</h2>
          <Link href="/signup" className="mt-6 inline-block rounded-lg bg-accent px-5 py-3 text-sm font-medium text-accent-foreground hover:opacity-90">Get Started Today</Link>
        </div>
      </section>
    </div>
  );
}
