"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ResetForm() {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Reset link is invalid or expired.");
      return;
    }
    setDone(true);
  };

  if (!token) {
    return <p className="text-sm text-danger">Reset link is invalid or expired.</p>;
  }

  if (done) {
    return (
      <div className="rounded-lg bg-emerald-500/15 px-4 py-3 text-sm text-emerald-400">
        Password updated. You can now sign in.
        <div className="mt-4">
          <Link href="/login" className="text-accent hover:underline">Sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <div className="rounded-lg bg-danger/15 px-3 py-2 text-sm text-danger">{error}</div>}
      <div>
        <label className="text-xs font-medium text-muted-foreground">New password</label>
        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Confirm password</label>
        <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
      </div>
      <p className="text-xs text-muted-foreground">At least 8 characters, including a letter and a number.</p>
      <button disabled={loading} className="w-full rounded-lg bg-accent py-2.5 text-sm font-medium text-accent-foreground disabled:opacity-50">
        {loading ? "Saving…" : "Set new password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-xl">
        <h1 className="mb-2 text-2xl font-semibold">Set a new password</h1>
        <p className="mb-6 text-sm text-muted-foreground">Choose a new password for your account.</p>
        <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  );
}
