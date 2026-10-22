export type RelatedCounts = { quotes: number; jobs: number; invoices: number };

export function relatedTotal(counts: RelatedCounts) {
  return counts.quotes + counts.jobs + counts.invoices;
}

export function customerDeleteDecision(counts: RelatedCounts) {
  const total = relatedTotal(counts);
  if (total > 0) {
    const parts = [
      counts.quotes ? `${counts.quotes} quote${counts.quotes === 1 ? "" : "s"}` : "",
      counts.jobs ? `${counts.jobs} job${counts.jobs === 1 ? "" : "s"}` : "",
      counts.invoices ? `${counts.invoices} invoice${counts.invoices === 1 ? "" : "s"}` : "",
    ].filter(Boolean);
    return {
      allowed: false,
      message: `This customer has ${parts.join(", ")}. Archive the customer instead so those records stay intact.`,
    };
  }
  return { allowed: true, message: "" };
}

export function isArchived(customer: { archivedAt?: Date | string | null }) {
  return !!customer.archivedAt;
}

export function selectableCustomers<T extends { archivedAt?: Date | string | null }>(customers: T[]) {
  return customers.filter((customer) => !isArchived(customer));
}
