export const TRIAL_DAYS = 30;
const DAY = 24 * 60 * 60 * 1000;

export function trialEndFrom(start: Date, days = TRIAL_DAYS) {
  return new Date(start.getTime() + days * DAY);
}

export function daysRemaining(end: Date | string | null | undefined, now = new Date()) {
  if (!end) return null;
  const ms = new Date(end).getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / DAY));
}

export function trialDayNumber(start: Date | string | null | undefined, now = new Date()) {
  if (!start) return null;
  const ms = now.getTime() - new Date(start).getTime();
  if (ms < 0) return 0;
  return Math.floor(ms / DAY) + 1;
}

/** Start a 30-day trial once, after approval, only if the company has never used a trial and is not already paying. */
export function trialStartUpdate(org: {
  trialUsed?: boolean | null;
  stripeSubscriptionId?: string | null;
  subscriptionStatus?: string | null;
}) {
  if (org.trialUsed) return null;
  if (org.stripeSubscriptionId) return null;
  if (org.subscriptionStatus === "active" || org.subscriptionStatus === "past_due") return null;
  const start = new Date();
  return {
    subscriptionStatus: "trialing",
    trialStart: start,
    trialEnd: trialEndFrom(start),
    trialUsed: true,
  };
}

/** Extend an existing active 14-day trial to 30 days from the original start. Does not reset the start date or touch paid subscriptions. */
export function extendedTrialEnd(org: {
  subscriptionStatus?: string | null;
  trialStart?: Date | string | null;
  trialEnd?: Date | string | null;
  stripeSubscriptionId?: string | null;
}) {
  if (org.subscriptionStatus === "active") return null;
  if (!org.trialStart || !org.trialEnd) return null;
  if (org.subscriptionStatus && org.subscriptionStatus !== "trialing") return null;
  const start = new Date(org.trialStart);
  const end = new Date(org.trialEnd);
  const days = (end.getTime() - start.getTime()) / DAY;
  if (days >= 29) return null;
  const next = trialEndFrom(start);
  if (next.getTime() <= end.getTime()) return null;
  return next;
}
