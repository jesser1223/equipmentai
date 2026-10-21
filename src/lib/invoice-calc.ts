export function invoiceTotals(subtotal: number, taxRate: number) {
  const roundedSubtotal = Math.round(subtotal * 100) / 100;
  const taxAmount = Math.round(roundedSubtotal * taxRate * 100) / 100;
  const total = Math.round((roundedSubtotal + taxAmount) * 100) / 100;
  return { subtotal: roundedSubtotal, taxAmount, total };
}

export function outstandingBalance(
  invoices: { status: string; total: number; amountPaid: number }[]
) {
  return invoices
    .filter((i) => i.status !== "Void" && i.status !== "Paid")
    .reduce((sum, i) => sum + Math.max(0, i.total - i.amountPaid), 0);
}
