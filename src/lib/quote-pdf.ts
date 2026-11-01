import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function buildQuotePdf(quote: any): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const org = quote.organization || {};
  let y = 740;
  const left = 50;

  page.drawText(org.name || "Quote", { x: left, y, size: 18, font: bold, color: rgb(0.05, 0.45, 0.42) });
  y -= 16;
  if (org.address) { page.drawText(String(org.address), { x: left, y, size: 9, font }); y -= 12; }
  if (org.phone) { page.drawText(String(org.phone), { x: left, y, size: 9, font }); y -= 12; }
  if (org.email) { page.drawText(String(org.email), { x: left, y, size: 9, font }); y -= 12; }
  if (org.gstNumber) { page.drawText(`GST: ${org.gstNumber}`, { x: left, y, size: 9, font }); y -= 12; }

  page.drawText("QUOTE", { x: 430, y: 740, size: 16, font: bold });
  page.drawText(quote.number, { x: 430, y: 722, size: 10, font });
  page.drawText(`Date ${new Date(quote.createdAt).toLocaleDateString()}`, { x: 430, y: 708, size: 9, font });

  y -= 20;
  page.drawText("Bill to", { x: left, y, size: 10, font: bold });
  y -= 14;
  page.drawText(quote.customer?.name || "", { x: left, y, size: 10, font });
  y -= 12;
  if (quote.customer?.company) { page.drawText(quote.customer.company, { x: left, y, size: 9, font }); y -= 12; }
  if (quote.jobName) { page.drawText(`Job: ${quote.jobName}`, { x: left, y, size: 9, font }); y -= 12; }
  if (quote.location) { page.drawText(`Location: ${quote.location}`, { x: left, y, size: 9, font }); y -= 12; }

  y -= 10;
  page.drawText("Description", { x: left, y, size: 9, font: bold });
  page.drawText("Qty", { x: 340, y, size: 9, font: bold });
  page.drawText("Rate", { x: 400, y, size: 9, font: bold });
  page.drawText("Amount", { x: 480, y, size: 9, font: bold });
  y -= 8;
  page.drawLine({ start: { x: left, y }, end: { x: 562, y }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
  y -= 16;

  for (const line of quote.lines || []) {
    const label = line.lineType === "attachment" ? `${line.description} (attachment)` : line.description;
    page.drawText(String(label).slice(0, 48), { x: left, y, size: 9, font });
    page.drawText(String(line.quantity), { x: 340, y, size: 9, font });
    page.drawText(`$${Number(line.rate).toFixed(2)}`, { x: 400, y, size: 9, font });
    page.drawText(`$${Number(line.amount).toFixed(2)}`, { x: 480, y, size: 9, font });
    y -= 14;
  }

  y -= 8;
  page.drawText(`Subtotal $${Number(quote.subtotal).toFixed(2)}`, { x: 400, y, size: 9, font });
  y -= 14;
  page.drawText(`GST $${Number(quote.taxAmount).toFixed(2)}`, { x: 400, y, size: 9, font });
  y -= 16;
  page.drawText(`Total $${Number(quote.total).toFixed(2)}`, { x: 400, y, size: 11, font: bold });

  if (quote.notes) {
    y -= 24;
    page.drawText("Notes", { x: left, y, size: 9, font: bold });
    y -= 12;
    page.drawText(String(quote.notes).slice(0, 90), { x: left, y, size: 9, font });
  }

  return doc.save();
}
