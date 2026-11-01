import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function QuotePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const orgId = (session?.user as any)?.organizationId;
  if (!orgId) notFound();
  const { id } = await params;
  const quote = await prisma.quote.findFirst({
    where: { id, organizationId: orgId },
    include: { customer: true, lines: true, organization: true },
  });
  if (!quote) notFound();

  return (
    <html>
      <head>
        <title>Quote {quote.number}</title>
        <style>{`
          body { font-family: system-ui, sans-serif; color: #111; background: #fff; margin: 0; padding: 24px; }
          .header { display: flex; justify-content: space-between; margin-bottom: 24px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { text-align: left; padding: 8px; border-bottom: 1px solid #ddd; font-size: 13px; }
          .totals { margin-top: 16px; text-align: right; }
          .grand { font-size: 18px; font-weight: 700; }
          @media print { @page { margin: 0.5in; } }
        `}</style>
      </head>
      <body>
        <div className="header">
          <div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{quote.organization.name}</div>
            <div>{quote.organization.address}</div>
            <div>{quote.organization.phone}</div>
            <div>{quote.organization.email}</div>
            {quote.organization.gstNumber && <div>GST: {quote.organization.gstNumber}</div>}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>QUOTE</div>
            <div>{quote.number}</div>
            <div>{new Date(quote.createdAt).toLocaleDateString()}</div>
          </div>
        </div>
        <div>
          <strong>Bill to</strong>
          <div>{quote.customer.name}</div>
          <div>{quote.customer.company}</div>
          <div>{quote.customer.email}</div>
          <div>{quote.customer.phone}</div>
          <div>Job: {quote.jobName}</div>
          {quote.location && <div>Location: {quote.location}</div>}
        </div>
        <table>
          <thead>
            <tr><th>Description</th><th>Type</th><th>Method</th><th>Qty</th><th>Rate</th><th>Amount</th></tr>
          </thead>
          <tbody>
            {quote.lines.map((line) => (
              <tr key={line.id}>
                <td>{line.description}</td>
                <td>{line.lineType === "attachment" ? "Attachment" : line.lineType === "equipment" ? "Equipment" : "Custom"}</td>
                <td>{line.billingMethod || "—"}</td>
                <td>{line.quantity} {line.unit}</td>
                <td>${line.rate.toFixed(2)}</td>
                <td>${line.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="totals">
          <div>Subtotal ${quote.subtotal.toFixed(2)}</div>
          <div>GST ${quote.taxAmount.toFixed(2)}</div>
          <div className="grand">Total ${quote.total.toFixed(2)}</div>
        </div>
        {quote.notes && <div style={{ marginTop: 24 }}>Notes: {quote.notes}</div>}
        <script dangerouslySetInnerHTML={{ __html: "window.onload=function(){window.print()}" }} />
      </body>
    </html>
  );
}
