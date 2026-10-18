"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // Real email sending requires Resend/Postmark configuration.
    // For now we show a confirmation without revealing account existence.
    setSent(true);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-xl">
        <h1 className="mb-2 text-2xl font-semibold">Reset password</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Enter your email and we’ll send reset instructions if an account exists.
        </p>

        {sent ? (
          <div className="rounded-lg bg-emerald-500/15 px-4 py-3 text-sm text-emerald-400">
            If an account exists for that email, you’ll receive reset instructions shortly.
            <div className="mt-4">
              <Link href="/login" className="text-accent hover:underline">Back to sign in</Link>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <button className="w-full rounded-lg bg-accent py-2.5 text-sm font-medium text-accent-foreground">
              Send reset link
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm">
          <Link href="/login" className="text-accent hover:underline">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
