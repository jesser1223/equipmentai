import { assistantEntitlementUpdate, billingAccess } from "./entitlement";

function daysFromNow(days: number) {
  return new Date(Date.now() + days * 86400000);
}

const cases = [
  {
    name: "approved company with no trial starts a 30-day trial",
    org: { status: "Approved", subscriptionStatus: null, trialUsed: false },
    expect: true,
  },
  {
    name: "existing 14-day trial is extended",
    org: { status: "Approved", subscriptionStatus: "trialing", trialUsed: true, trialStart: daysFromNow(-10), trialEnd: daysFromNow(4) },
    expect: true,
    checkEnd: true,
  },
  {
    name: "active paid company",
    org: { status: "Approved", subscriptionStatus: "active", stripeSubscriptionId: "sub_1" },
    expect: true,
  },
  {
    name: "expired trial",
    org: { status: "Approved", subscriptionStatus: "trialing", trialUsed: true, trialStart: daysFromNow(-40), trialEnd: daysFromNow(-10) },
    expect: false,
  },
  {
    name: "pending company",
    org: { status: "Pending", subscriptionStatus: null },
    expect: false,
  },
  {
    name: "suspended company",
    org: { status: "Suspended", subscriptionStatus: "trialing", trialEnd: daysFromNow(10) },
    expect: false,
  },
];

let failed = 0;
for (const item of cases) {
  const result = assistantEntitlementUpdate(item.org as any);
  if (result.access.allowed !== item.expect) {
    failed += 1;
    console.error("FAIL", item.name, result.access);
  }
  if (item.checkEnd) {
    const end = new Date(result.updates.trialEnd || item.org.trialEnd);
    const start = new Date(item.org.trialStart as Date);
    const days = (end.getTime() - start.getTime()) / 86400000;
    if (days < 29) {
      failed += 1;
      console.error("FAIL extension days", days);
    }
  }
}
const expired = billingAccess({ status: "Approved", subscriptionStatus: "trialing", trialEnd: daysFromNow(-1) });
if (expired.allowed) {
  failed += 1;
  console.error("FAIL expired billingAccess");
}
if (failed) {
  console.error(`${failed} entitlement checks failed`);
  process.exit(1);
}
console.log("entitlement checks passed");
