export const QUOTE_STATUSES = ["Draft", "Sent", "Accepted", "Declined"] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

const TRANSITIONS: Record<string, QuoteStatus[]> = {
  Draft: ["Sent", "Accepted", "Declined"],
  Sent: ["Accepted", "Declined"],
  Accepted: [],
  Declined: ["Draft", "Sent"],
};

export function canTransitionQuote(from: string, to: string, hasJob = false) {
  if (from === to) return true;
  if (hasJob) return false;
  return (TRANSITIONS[from] || []).includes(to as QuoteStatus);
}

export function quoteTransitionError(from: string, to: string, hasJob = false) {
  if (hasJob) return "This quote has been converted to a job and cannot change status.";
  if (from === to) return "";
  if (!canTransitionQuote(from, to, hasJob)) {
    return `Cannot change a ${from} quote to ${to}.`;
  }
  return "";
}

/** Organization convention: 0.05 means 5%. Values above 1 are treated as a percent. */
export function normalizeTaxRate(input: number) {
  if (!Number.isFinite(input) || input < 0) return 0;
  return input > 1 ? input / 100 : input;
}

export function quoteTaxAmount(subtotal: number, taxRate: number) {
  const rate = normalizeTaxRate(taxRate);
  return Math.round(subtotal * rate * 100) / 100;
}

export function quoteTotal(subtotal: number, taxRate: number) {
  const tax = quoteTaxAmount(subtotal, taxRate);
  return Math.round((subtotal + tax) * 100) / 100;
}

export function taxPercentLabel(taxRate: number) {
  return `${(normalizeTaxRate(taxRate) * 100).toFixed(1)}%`;
}

export type ConversionInput = {
  startDate?: string | null;
  endDate?: string | null;
  equipmentId?: string | null;
  location?: string | null;
};

export function validateQuoteConversion(
  quote: { status: string; job?: { id: string } | null; location?: string | null; lines?: { equipmentId?: string | null }[] },
  input: ConversionInput
) {
  if (quote.job) return "This quote has already been converted to a job.";
  if (quote.status !== "Accepted") return "Only accepted quotes can be converted to a job.";
  if (!input.startDate) return "Start date is required.";
  if (input.endDate && new Date(input.endDate) < new Date(input.startDate)) {
    return "End date cannot be before the start date.";
  }
  const location = (input.location || quote.location || "").trim();
  if (!location) return "A job location is required.";
  const equipmentId = input.equipmentId || quote.lines?.find((line) => line.equipmentId)?.equipmentId || null;
  return { location, equipmentId, startDate: input.startDate, endDate: input.endDate || null };
}
