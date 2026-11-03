import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function buildReceiptPdf(input: {
  organization: any;
  customer: any;
  invoice: any;
  payment: any;
  amountPaid: number;
  remaining: number;
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const org = input.organization || {};
  let y = 740;
  const left = 50;

  page.drawText(org.name || "Receipt", { x: left, y, size: 18, font: bold, color: rgb(0.05, 0.45, 0.42) });
  y -= 16;
  if (org.address) { page.drawText(String(org.address), { x: left, y, size: 9, font }); y -= 12; }
  if (org.phone) { page.drawText(String(org.phone), { x: left, y, size: 9, font }); y -= 12; }
  if (org.email) { page.drawText(String(org.email), { x: left, y, size: 9, font }); y -= 12; }

  page.drawText("PAYMENT RECEIPT", { x: 390, y: 740, size: 14, font: bold });
  page.drawText(input.invoice.number, { x: 390, y: 722, size: 10, font });

  y -= 24;
  page.drawText(`Customer: ${input.customer?.name || ""}`, { x: left, y, size: 10, font });
  y -= 16;
  page.drawText(`Payment amount: $${Number(input.payment.amount).toFixed(2)}`, { x: left, y, size: 11, font: bold });
  y -= 14;
  page.drawText(`Payment date: ${new Date(input.payment.paidAt).toLocaleDateString()}`, { x: left, y, size: 10, font });
  y -= 14;
  if (input.payment.method) { page.drawText(`Method: ${input.payment.method}`, { x: left, y, size: 10, font }); y -= 14; }
  if (input.payment.reference) { page.drawText(`Reference: ${input.payment.reference}`, { x: left, y, size: 10, font }); y -= 14; }
  y -= 10;
  page.drawText(`Invoice total: $${Number(input.invoice.total).toFixed(2)}`, { x: left, y, size: 10, font });
  y -= 14;
  page.drawText(`Paid to date: $${Number(input.amountPaid).toFixed(2)}`, { x: left, y, size: 10, font });
  y -= 14;
  page.drawText(`Remaining balance: $${Number(input.remaining).toFixed(2)}`, { x: left, y, size: 11, font: bold });
  y -= 20;
  page.drawText("Remaining balance is the invoice total minus payments recorded through this payment.", { x: left, y, size: 8, font });

  return doc.save();
}
