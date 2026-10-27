import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function InvoicePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const orgId = (session?.user as any)?.organizationId;
  if (!orgId) notFound();

  const { id } = await params;
  const invoice = await prisma.invoice.findFirst({
    where: { id, organizationId: orgId },
    include: { customer: true, job: true, lines: true, organization: true, payments: true },
  });
  if (!invoice) notFound();

  const paid = invoice.payments.reduce((s, p) => s + p.amount, 0);
  const balance = Math.max(0, invoice.total - paid);

  return (
    <html>
      <head>
        <title>Invoice {invoice.number}</title>
        <style>{`
          @media print {
            @page { margin: 0.5in; }
            body { -webkit-print-color-adjust: exact; }
          }
          body { font-family: system-ui, sans-serif; color: #111; background: #fff; margin: 0; padding: 24px; }
          .header { display: flex; justify-content: space-between; margin-bottom: 32px; }
          .company { font-size: 20px; font-weight: 700; }
          .meta { text-align: right; font-size: 13px; color: #444; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { text-align: left; padding: 8px; border-bottom: 1px solid #ddd; font-size: 13px; }
          th { background: #f5f5f5; }
          .totals { margin-top: 16px; text-align: right; }
          .totals div { margin: 4px 0; }
          .grand { font-size: 18px; font-weight: 700; }
          .notes { margin-top: 24px; font-size: 12px; color: #555; }
        `}</style>
      </head>
      <body>
        <div className="header">
          <div>
            <div className="company">{invoice.organization.name}</div>
            <div style={{ fontSize: 13, color: "#555" }}>{invoice.organization.phone || ""}</div>
          </div>
          <div className="meta">
            <div style={{ fontSize: 24, fontWeight: 700 }}>INVOICE</div>
            <div>{invoice.number}</div>
            <div>Issued: {new Date(invoice.issueDate).toLocaleDateString()}</div>
            {invoice.dueDate && <div>Due: {new Date(invoice.dueDate).toLocaleDateString()}</div>}
            <div>Status: {invoice.status}</div>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: 600 }}>Bill To</div>
          <div>{invoice.customer.name}</div>
          {invoice.customer.company && <div>{invoice.customer.company}</div>}
          {invoice.customer.address && <div>{invoice.customer.address}</div>}
          {invoice.job && <div style={{ marginTop: 8 }}>Job: {invoice.job.title} — {invoice.job.location}</div>}
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Qty</th>
              <th>Unit</th>
              <th>Rate</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lines.map((l) => (
              <tr key={l.id}>
                <td>{l.description}</td>
                <td>{l.quantity}</td>
                <td>{l.unit}</td>
                <td>${l.rate.toFixed(2)}</td>
                <td>${l.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="totals">
          <div>Subtotal: ${invoice.subtotal.toFixed(2)}</div>
          <div>GST ({((invoice.taxRate || 0) * 100).toFixed(0)}%): ${invoice.taxAmount.toFixed(2)}</div>
          <div className="grand">Total: ${invoice.total.toFixed(2)}</div>
          <div>Paid: ${paid.toFixed(2)}</div>
          <div>Balance: ${balance.toFixed(2)}</div>
        </div>

        {invoice.notes && <div className="notes">{invoice.notes}</div>}

        <script dangerouslySetInnerHTML={{ __html: "window.onload = () => { setTimeout(() => window.print(), 300); };" }} />
      </body>
    </html>
  );
}
