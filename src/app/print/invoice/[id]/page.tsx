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
      setTimeout(() => window.print(), 400);
    })();
    return () => { cancelled = true; };
  }, [params]);

  if (error) return <div style={{ padding: 24 }}>{error}</div>;
  if (!invoice) return <div style={{ padding: 24 }}>Loading invoice…</div>;

  const paid = (invoice.payments || []).reduce((s: number, p: any) => s + p.amount, 0);
  const balance = Math.max(0, invoice.total - paid);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", color: "#111", background: "#fff", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{invoice.organization?.name}</div>
          <div style={{ fontSize: 13, color: "#555" }}>{invoice.organization?.phone || ""}</div>
        </div>
        <div style={{ textAlign: "right", fontSize: 13, color: "#444" }}>
          <div style={{ fontSize: 24, fontWeight: 700 }}>INVOICE</div>
          <div>{invoice.number}</div>
          <div>Issued: {new Date(invoice.issueDate).toLocaleDateString()}</div>
          {invoice.dueDate && <div>Due: {new Date(invoice.dueDate).toLocaleDateString()}</div>}
          <div>Status: {invoice.status}</div>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 600 }}>Bill To</div>
        <div>{invoice.customer?.name}</div>
        {invoice.customer?.company && <div>{invoice.customer.company}</div>}
        {invoice.customer?.address && <div>{invoice.customer.address}</div>}
        {invoice.job && <div style={{ marginTop: 8 }}>Job: {invoice.job.title}</div>}
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16 }}>
        <thead>
          <tr>
            {["Description", "Qty", "Unit", "Rate", "Amount"].map((h) => (
              <th key={h} style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd", background: "#f5f5f5", fontSize: 13 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(invoice.lines || []).map((l: any) => (
            <tr key={l.id}>
              <td style={{ padding: 8, borderBottom: "1px solid #ddd", fontSize: 13 }}>{l.description}</td>
              <td style={{ padding: 8, borderBottom: "1px solid #ddd", fontSize: 13 }}>{l.quantity}</td>
              <td style={{ padding: 8, borderBottom: "1px solid #ddd", fontSize: 13 }}>{l.unit}</td>
              <td style={{ padding: 8, borderBottom: "1px solid #ddd", fontSize: 13 }}>${l.rate.toFixed(2)}</td>
              <td style={{ padding: 8, borderBottom: "1px solid #ddd", fontSize: 13 }}>${l.amount.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 16, textAlign: "right" }}>
        <div>Subtotal: ${invoice.subtotal.toFixed(2)}</div>
        <div>GST ({((invoice.taxRate || 0) * 100).toFixed(0)}%): ${invoice.taxAmount.toFixed(2)}</div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Total: ${invoice.total.toFixed(2)}</div>
        <div>Paid: ${paid.toFixed(2)}</div>
        <div>Balance: ${balance.toFixed(2)}</div>
      </div>

      {invoice.notes && <div style={{ marginTop: 24, fontSize: 12, color: "#555" }}>{invoice.notes}</div>}
    </div>
  );
}
