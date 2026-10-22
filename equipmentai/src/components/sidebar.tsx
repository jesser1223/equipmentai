"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Calendar,
  Truck,
  Users,
  FileText,
  Settings,
  Wrench,
  Quote,
  ShieldCheck,
} from "lucide-react";

const baseNav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/schedule", label: "Schedule", icon: Calendar },
  { href: "/equipment", label: "Equipment", icon: Truck },
  { href: "/quotes", label: "Quotes", icon: Quote },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isOwner = !!(session?.user as any)?.isOwner;

  const nav = isOwner
    ? [...baseNav, { href: "/admin", label: "Approvals", icon: ShieldCheck }]
    : baseNav;

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-sidebar md:flex">
      <div className="flex h-16 items-center gap-3 border-b border-border px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
          <Wrench className="h-5 w-5 text-accent-foreground" />
        </div>
        <div>
          <div className="text-sm font-semibold tracking-tight">EquipmentAI</div>
          <div className="text-[11px] text-muted-foreground">Fleet Management</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {nav.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-accent/15 text-accent"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-4">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full rounded-lg border border-border px-3 py-2 text-xs hover:bg-white/5"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}