"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function BillingPage() {
  const { data: session } = useSession();
  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/billing/status")
      .then((r) => r.json())
      .then(setOrg)
      .catch(() => setError("Could not load billing"))
      .finally(() => setLoading(false));
  }, []);

  const startCheckout = async () => {
    const res = await fetch("/api/billing/checkout", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else setError(data.error || "Could not start checkout");
  };

  const openPortal = async () => {
    const res = await fetch("/api/billing/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else setError(data.error || "Could not open portal");
  };

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Loading billing…</div>;

  return (
    <div className="mx-auto max-w-lg space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Billing</h1>
      {error && <div className="rounded-lg bg-danger/15 px-4 py-2 text-sm text-danger">{error}</div>}

      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div className="text-sm">Plan: <strong>$149 CAD / month</strong> (company)</div>
        <div className="text-sm">Status: <strong>{org?.subscriptionStatus || "No subscription"}</strong></div>
        {org?.trialEnd && <div className="text-sm">Trial ends: {new Date(org.trialEnd).toLocaleDateString()}</div>}
        {org?.currentPeriodEnd && <div className="text-sm">Current period ends: {new Date(org.currentPeriodEnd).toLocaleDateString()}</div>}
        {org?.graceUntil && <div className="text-sm text-amber-400">Grace period until: {new Date(org.graceUntil).toLocaleDateString()}</div>}
        {org?.cancelAtPeriodEnd && <div className="text-sm text-muted-foreground">Cancels at period end</div>}
      </div>

      <div className="flex gap-3">
        <button onClick={startCheckout} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">
          {org?.subscriptionStatus ? "Manage Subscription" : "Start Subscription"}
        </button>
        {org?.stripeCustomerId && (
          <button onClick={openPortal} className="rounded-lg border border-border px-4 py-2 text-sm">
            Customer Portal
          </button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        14-day free trial. No card required to start. After trial, a payment method is required. Failed payments have a 7-day grace period. Cancellation keeps access until the end of the paid period. Data is never deleted.
      </p>
    </div>
  );
}
