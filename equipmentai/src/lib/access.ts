export const APPROVED_STATUS = "Approved";

export function canAccessApp(status: string | null | undefined, isOwner: boolean) {
  if (isOwner) return true;
  return status === APPROVED_STATUS;
}

export function accessBlock(status: string | null | undefined): "pending" | "denied" | "suspended" | "unapproved" {
  if (status === "Pending") return "pending";
  if (status === "Denied") return "denied";
  if (status === "Suspended") return "suspended";
  return "unapproved";
}

export function accessMessage(status: string | null | undefined) {
  const block = accessBlock(status);
  if (block === "pending") return "This company is waiting for approval.";
  if (block === "denied") return "This company does not have access.";
  if (block === "suspended") return "This company is suspended.";
  return "This company does not have access.";
}
