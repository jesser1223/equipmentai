"use client";

import { Bell, Search } from "lucide-react";
import { useSession } from "next-auth/react";

export function Header({ title = "Dashboard" }: { title?: string }) {
  const { data: session } = useSession();
  const user = session?.user as any;
  const displayName = user?.name || user?.email?.split("@")[0] || "Account";
  const initials = displayName
    .split(" ")
    .map((p: string) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card/50 px-6 backdrop-blur-sm">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
        <p className="text-xs text-muted-foreground">
          {user?.organizationName ? user.organizationName : "Overview of equipment and jobs"}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search equipment, jobs..."
            className="h-9 w-64 rounded-lg border border-border bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-white/5">
          <Bell className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 rounded-lg border border-border px-2 py-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/30 text-xs font-medium">
            {initials}
          </div>
          <div className="hidden text-sm sm:block">
            <div className="font-medium leading-tight">{displayName}</div>
            {user?.organizationName && (
              <div className="text-[10px] text-muted-foreground leading-tight">{user.organizationName}</div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
