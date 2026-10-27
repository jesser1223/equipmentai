"use client";

import { useEffect, useState } from "react";

export default function InvoicePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const [invoice, setInvoice] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { id } = await params;
      const res = await fetch(`/api/invoices/${id}`);
      const data = await res.json();
      if (cancelled) return;
      if (!res.ok) {
        setError(data.error || "Could not load invoice");
        return;
      }
      setInvoice(data);
      setTimeout(() => {
        window.print();
      }, 400);
    })();
    return () => { cancelled = true; };
  }, [params]);

  if (error) return <div style={{ padding: 24 }}>{error}</div>;
  if (!invoice) return <div style={{ padding: 24 }}>Loading invoice…</div>;

  const paid = (invoice.payments || []).reduce((s: number, p: any) => s + p.amount, 0);
  const balance = Math.max(0, invoice.total - paid);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", color: "#111", background: "#fff", padding: "32px 40px", maxWidth: 800, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #111", paddingBottom: 16, marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{invoice.organization?.name}</div>
          {invoice.organization?.phone && <div style={{ fontSize: 13, color: "#555", marginTop: 4 }}>{invoice.organization.phone}</div>}
          {invoice.organization?.email && <div style={{ fontSize: 13, color: "#555" }}>{invoice.organization.email}</div>}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: 1 }}>INVOICE</div>
          <div style={{ fontSize: 14, marginTop: 4 }}>{invoice.number}</div>
          <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>Issued: {new Date(invoice.issueDate).toLocaleDateString()}</div>
          {invoice.dueDate && <div style={{ fontSize: 12, color: "#555" }}>Due: {new Date(invoice.dueDate).toLocaleDateString()}</div>}
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#777", textTransform: "uppercase", letterSpacing: 0.5 }}>Bill To</div>
        <div style={{ marginTop: 4, fontWeight: 600 }}>{invoice.customer?.name}</div>
        {invoice.customer?.company && <div>{invoice.customer.company}</div>}
        {invoice.customer?.address && <div style={{ color: "#444" }}>{invoice.customer.address}</div>}
        {invoice.job && <div style={{ marginTop: 6, fontSize: 13 }}>Job: {invoice.job.title}{invoice.job.location ? ` — ${invoice.job.location}` : ""}</div>}
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {["Description", "Qty", "Unit", "Rate", "Amount"].map((h) => (
              <th key={h} style={{ textAlign: "left", padding: "10px 8px", borderBottom: "2px solid #111", fontSize: 12, fontWeight: 600 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(invoice.lines || []).map((l: any) => (
            <tr key={l.id}>
              <td style={{ padding: "10px 8px", borderBottom: "1px solid #eee", fontSize: 13 }}>{l.description}</td>
              <td style={{ padding: "10px 8px", borderBottom: "1px solid #eee", fontSize: 13 }}>{l.quantity}</td>
              <td style={{ padding: "10px 8px", borderBottom: "1px solid #eee", fontSize: 13 }}>{l.unit}</td>
              <td style={{ padding: "10px 8px", borderBottom: "1px solid #eee", fontSize: 13 }}>${l.rate.toFixed(2)}</td>
              <td style={{ padding: "10px 8px", borderBottom: "1px solid #eee", fontSize: 13, textAlign: "right" }}>${l.amount.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 16, marginLeft: "auto", width: 220, fontSize: 13 }}>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}><span>Subtotal</span><span>${invoice.subtotal.toFixed(2)}</span></div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}><span>GST ({((invoice.taxRate || 0) * 100).toFixed(0)}%)</span><span>${invoice.taxAmount.toFixed(2)}</span></div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: "2px solid #111", fontSize: 16, fontWeight: 700 }}><span>Total</span><span>${invoice.total.toFixed(2)}</span></div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", color: "#555" }}><span>Paid</span><span>${paid.toFixed(2)}</span></div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontWeight: 600 }}><span>Balance</span><span>${balance.toFixed(2)}</span></div>
      </div>

      {invoice.organization?.invoiceFooter && (
        <div style={{ marginTop: 32, fontSize: 11, color: "#777", borderTop: "1px solid #eee", paddingTop: 12 }}>{invoice.organization.invoiceFooter}</div>
      )}
    </div>
  );
}
