import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-06-20",
  typescript: true,
});

export const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID || "";

export function billingAccess(org: {
  status: string;
  subscriptionStatus?: string | null;
  trialEnd?: Date | string | null;
  graceUntil?: Date | string | null;
  currentPeriodEnd?: Date | string | null;
  cancelAtPeriodEnd?: boolean | null;
}) {
  // Existing approval still required
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
