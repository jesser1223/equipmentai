"use client";

import { signOut } from "next-auth/react";

export default function PendingPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md rounded-2xl border border-border bg-card p-8 text-center">
        <h1 className="text-xl font-semibold">Application pending</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your company account is waiting for approval. You’ll be able to access EquipmentAI once the owner reviews and approves it.
        </p>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-6 rounded-lg border border-border px-4 py-2 text-sm hover:bg-white/5"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}