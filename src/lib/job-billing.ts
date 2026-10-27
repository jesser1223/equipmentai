export type BillingLine = {
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
};

export type AttachmentInput = {
  id: string;
  name: string;
  rate: number;
  hours: number;
};

export type JobBillingInput = {
  equipmentName?: string;
  equipmentUnit?: string;
  equipmentRate?: number;
  actualHours?: number | null;
  attachments?: AttachmentInput[];
  fuelCost?: number | null;
  taxRate?: number;
};

export function calculateJobCharges(input: JobBillingInput) {
  const lines: BillingLine[] = [];
  const missing: string[] = [];

  const hours = input.actualHours ?? 0;
  const eqRate = input.equipmentRate ?? 0;
  if (hours > 0) {
    if (eqRate <= 0) {
      missing.push("equipment rate");
    } else {
      const amount = Math.round(hours * eqRate * 100) / 100;
      lines.push({
        description: `${input.equipmentName || "Equipment"}${input.equipmentUnit ? ` (${input.equipmentUnit})` : ""} – machine hours`,
        quantity: hours,
        unit: "hours",
        rate: eqRate,
        amount,
      });
    }
  }

  for (const att of input.attachments || []) {
    const h = att.hours || 0;
    if (h <= 0) continue;
    if (att.rate <= 0) {
      missing.push(`${att.name} rate`);
      continue;
    }
    const amount = Math.round(h * att.rate * 100) / 100;
    lines.push({
      description: `${att.name} – attachment hours`,
      quantity: h,
      unit: "hours",
      rate: att.rate,
      amount,
    });
  }

  const fuel = input.fuelCost ?? 0;
  if (fuel > 0) {
    lines.push({
      description: "Fuel",
      quantity: 1,
      unit: "each",
      rate: fuel,
      amount: Math.round(fuel * 100) / 100,
    });
  }

  const subtotal = Math.round(lines.reduce((s, l) => s + l.amount, 0) * 100) / 100;
  const taxRate = input.taxRate ?? 0;
  const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
  const total = Math.round((subtotal + taxAmount) * 100) / 100;

  return { lines, subtotal, taxRate, taxAmount, total, missing };
}
