import { prisma } from "@/lib/prisma";

export type QuoteLineInput = {
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
  equipmentId: string | null;
  attachmentId: string | null;
  lineType: string;
  billingMethod: string | null;
  attachmentName: string | null;
};

export async function normalizeQuoteLines(orgId: string, incoming: any[]): Promise<QuoteLineInput[]> {
  const lines: QuoteLineInput[] = [];
  for (const line of incoming) {
    const quantity = Number(line.quantity);
    const rate = Number(line.rate);
    if (!line.description || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(rate) || rate < 0) {
      throw new Error("Each line needs a description, quantity greater than zero, and a valid rate.");
    }

    let equipmentId: string | null = line.equipmentId || null;
    let attachmentId: string | null = line.attachmentId || null;
    let billingMethod: string | null = line.billingMethod || null;
    let attachmentName: string | null = line.attachmentName || null;
    let lineType = line.lineType || (attachmentId ? "attachment" : equipmentId ? "equipment" : "custom");

    if (attachmentId) {
      const att = await prisma.attachment.findFirst({
        where: { id: attachmentId, organizationId: orgId },
      });
      if (!att) throw new Error("Attachment not found.");
      if (equipmentId && att.equipmentId !== equipmentId) {
        throw new Error("Attachment does not belong to the selected equipment.");
      }
      equipmentId = att.equipmentId;
      attachmentName = att.name;
      billingMethod = att.billingMethod;
      lineType = "attachment";
      if (rate <= 0 && att.rate <= 0) {
        throw new Error(`Rate is not set for attachment ${att.name}.`);
      }
    } else if (equipmentId) {
      const eq = await prisma.equipment.findFirst({
        where: { id: equipmentId, organizationId: orgId },
      });
      if (!eq) throw new Error("Equipment not found.");
      lineType = "equipment";
    }

    const unit = billingMethod === "daily" ? "days" : billingMethod === "per-job" ? "job" : (line.unit || "hours");
    const amount = billingMethod === "per-job" ? Math.round(rate * 100) / 100 : Math.round(quantity * rate * 100) / 100;

    lines.push({
      description: String(line.description).trim(),
      quantity: billingMethod === "per-job" ? 1 : quantity,
      unit,
      rate,
      amount,
      equipmentId,
      attachmentId,
      lineType,
      billingMethod,
      attachmentName,
    });
  }
  return lines;
}
