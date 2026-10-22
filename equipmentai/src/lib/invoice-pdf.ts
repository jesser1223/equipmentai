import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function buildInvoicePdf(invoice: any): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]); // letter
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const org = invoice.organization;
  const paid = (invoice.payments || []).reduce((s: number, p: any) => s + p.amount, 0);
  const balance = Math.max(0, invoice.total - paid);

  let y = 740;
  const left = 50;
  const right = 562;

  page.drawText(org.name || "Invoice", { x: left, y, size: 18, font: bold, color: rgb(0.05, 0.45, 0.42) });
  y -= 16;
  if (org.address) { page.drawText(org.address, { x: left, y, size: 9, font }); y -= 12; }
  if (org.phone) { page.drawText(org.phone, { x: left, y, size: 9, font }); y -= 12; }
  if (org.email) { page.drawText(org.email, { x: left, y, size: 9, font }); y -= 12; }
  if (org.gstNumber) { page.drawText(`GST: ${org.gstNumber}`, { x: left, y, size: 9, font }); y -= 12; }

  page.drawText("INVOICE", { x: 420, y: 740, size: 16, font: bold });
  page.drawText(invoice.number, { x: 420, y: 722, size: 10, font });
  page.drawText(`Issued ${new Date(invoice.issueDate).toLocaleDateString()}`, { x: 420, y: 708, size: 9, font });
  if (invoice.dueDate) {
    page.drawText(`Due ${new Date(invoice.dueDate).toLocaleDateString()}`, { x: 420, y: 694, size: 9, font });
  }

  y = Math.min(y, 660) - 10;
  page.drawText("Bill To", { x: left, y, size: 9, font: bold, color: rgb(0.3, 0.3, 0.3) });
  y -= 14;
  page.drawText(invoice.customer?.name || "", { x: left, y, size: 11, font: bold });
  y -= 13;
  if (invoice.customer?.company) { page.drawText(invoice.customer.company, { x: left, y, size: 9, font }); y -= 12; }
  if (invoice.customer?.email) { page.drawText(invoice.customer.email, { x: left, y, size: 9, font }); y -= 12; }
  if (invoice.customer?.address) { page.drawText(invoice.customer.address, { x: left, y, size: 9, font }); y -= 12; }
  if (invoice.job?.title) { page.drawText(`Job: ${invoice.job.title}`, { x: left, y, size: 9, font }); y -= 12; }
  if (invoice.job?.location) { page.drawText(`Location: ${invoice.job.location}`, { x: left, y, size: 9, font }); y -= 12; }

  y -= 10;
  // table header
  page.drawRectangle({ x: left, y: y - 4, width: right - left, height: 16, color: rgb(0.94, 0.94, 0.94) });
  page.drawText("Description", { x: left + 4, y, size: 9, font: bold });
  page.drawText("Qty", { x: 340, y, size: 9, font: bold });
  page.drawText("Rate", { x: 400, y, size: 9, font: bold });
  page.drawText("Amount", { x: 490, y, size: 9, font: bold });
  y -= 18;

  for (const line of invoice.lines || []) {
    if (y < 100) break;
    page.drawText(String(line.description).slice(0, 50), { x: left + 4, y, size: 9, font });
    page.drawText(String(line.quantity), { x: 340, y, size: 9, font });
    page.drawText(`$${Number(line.rate).toFixed(2)}`, { x: 400, y, size: 9, font });
    page.drawText(`$${Number(line.amount).toFixed(2)}`, { x: 490, y, size: 9, font });
    y -= 14;
  }

  y -= 8;
  const money = (n: number) => `$${n.toFixed(2)}`;
  page.drawText(`Subtotal: ${money(invoice.subtotal)}`, { x: 380, y, size: 9, font }); y -= 12;
  page.drawText(`GST (${((invoice.taxRate || 0) * 100).toFixed(0)}%): ${money(invoice.taxAmount)}`, { x: 380, y, size: 9, font }); y -= 14;
  page.drawText(`Total: ${money(invoice.total)}`, { x: 380, y, size: 11, font: bold }); y -= 14;
  page.drawText(`Paid: ${money(paid)}`, { x: 380, y, size: 9, font }); y -= 12;
  page.drawText(`Balance due: ${money(balance)}`, { x: 380, y, size: 10, font: bold }); y -= 20;

  if (invoice.notes) {
    page.drawText(String(invoice.notes).slice(0, 200), { x: left, y, size: 8, font });
    y -= 14;
  }
  if (org.invoiceFooter) {
    page.drawText(String(org.invoiceFooter).slice(0, 200), { x: left, y, size: 8, font });
  }

  return doc.save();
}
