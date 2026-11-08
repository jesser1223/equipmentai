import Link from "next/link";

const included = [
  "One company subscription",
  "Equipment, jobs, customers, quotes, and invoices",
  "Maintenance tracking",
  "Equipment documents",
  "Payment recording and receipts",
  "Optional invoice email and overdue reminders",
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="text-4xl font-semibold">Pricing</h1>
      <p className="mt-3 text-white">One flat company plan. Not priced per user or per machine.</p>
      <div className="mt-8 rounded-2xl border border-border bg-card p-8">
        <div className="text-sm text-accent">EquipmentAI</div>
        <div className="mt-2 text-4xl font-semibold">$149 CAD</div>
        <div className="text-sm text-white">per company / month</div>
        <p className="mt-4 text-sm text-white">14-day free trial. No credit card required to start. After the trial, add a payment method to continue.</p>
        <ul className="mt-6 space-y-2 text-sm">
          {included.map((item) => <li key={item}>• {item}</li>)}
        </ul>
        <Link href="/signup" className="mt-6 inline-block rounded-lg bg-accent px-5 py-3 text-sm font-medium text-accent-foreground hover:opacity-90">Get Started</Link>
      </div>
    </div>
  );
}
