import { extendedTrialEnd, trialEndFrom, trialStartUpdate } from "@/lib/trial";

export type OrgAccess = {
  status: string;
  subscriptionStatus?: string | null;
  trialStart?: Date | string | null;
  trialEnd?: Date | string | null;
  trialUsed?: boolean | null;
  approvedAt?: Date | string | null;
  stripeSubscriptionId?: string | null;
  graceUntil?: Date | string | null;
  currentPeriodEnd?: Date | string | null;
  cancelAtPeriodEnd?: boolean | null;
};

export function billingAccess(org: OrgAccess) {
  if (org.status !== "Approved") {
    return { allowed: false, reason: "organization-not-approved", message: "Company is not approved." };
  }

  const status = org.subscriptionStatus;
  const now = new Date();

  if (status === "trialing") {
    const end = org.trialEnd ? new Date(org.trialEnd) : null;
    if (end && end > now) return { allowed: true, reason: "trial", message: "Trial active." };
    return { allowed: false, reason: "trial-ended", message: "Trial ended. Add a payment method to continue." };
  }

  if (status === "active") return { allowed: true, reason: "active", message: "Subscription active." };

  if (status === "past_due") {
    const grace = org.graceUntil ? new Date(org.graceUntil) : null;
    if (grace && grace > now) return { allowed: true, reason: "grace", message: "Payment failed. Update payment method within the grace period." };
    return { allowed: false, reason: "grace-expired", message: "Grace period ended. Update payment method to continue." };
  }

  if (status === "canceled" && org.currentPeriodEnd && new Date(org.currentPeriodEnd) > now) {
    return { allowed: true, reason: "canceled-paid-through", message: "Canceled. Access continues until the end of the current period." };
  }

  return { allowed: false, reason: "no-subscription", message: "Subscription required to continue." };
}

export function assistantEntitlementUpdate(org: OrgAccess) {
  if (org.status !== "Approved") return { updates: {}, access: billingAccess(org) };
  if (org.stripeSubscriptionId || ["active", "past_due", "canceled", "unpaid"].includes(org.subscriptionStatus || "")) {
    return { updates: {}, access: billingAccess(org) };
  }

  const updates: Record<string, any> = {};
  const start = trialStartUpdate(org);
  if (start) Object.assign(updates, start);

  const merged = { ...org, ...updates };
  const extended = extendedTrialEnd(merged);
  if (extended) updates.trialEnd = extended;

  if (!updates.trialStart && !org.trialStart && !org.trialUsed) {
    const trialStart = org.approvedAt ? new Date(org.approvedAt) : new Date();
    const trialEnd = trialEndFrom(trialStart);
    if (trialEnd > new Date()) {
      updates.subscriptionStatus = "trialing";
      updates.trialStart = trialStart;
      updates.trialEnd = trialEnd;
      updates.trialUsed = true;
    }
  }

  return { updates, access: billingAccess({ ...org, ...updates }) };
}
