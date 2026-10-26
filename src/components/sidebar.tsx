"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Calendar,
  Truck,
  Users,
  FileText,
  Receipt,
  Settings,
  Wrench,
  Quote,
  Package,
  ShieldCheck,
  Menu,
  X,
  ClipboardList,
  BarChart3,
} from "lucide-react";

const baseNav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/schedule", label: "Schedule", icon: Calendar },
  { href: "/equipment", label: "Equipment", icon: Truck },
  { href: "/maintenance", label: "Maintenance", icon: ClipboardList },
  { href: "/utilization", label: "Utilization", icon: BarChart3 },
  { href: "/quotes", label: "Quotes", icon: Quote },
  { href: "/supplies", label: "Supplies", icon: Package },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/billing", label: "Billing", icon: Receipt },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isOwner = !!(session?.user as any)?.isOwner;
  const [open, setOpen] = useState(false);

  const nav = isOwner
    ? [...baseNav, { href: "/admin", label: "Approvals", icon: ShieldCheck }]
    : baseNav;

  const close = () => setOpen(false);

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setOpen(true)}
        className="fixed left-3 top-3 z-40 flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card md:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={close}
        />
      )}

      {/* Sidebar / Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-sidebar transition-transform md:static md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
              <Wrench className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight">EquipmentAI</div>
              <div className="text-[11px] text-muted-foreground">Fleet Management</div>
            </div>
          </div>
          <button onClick={close} className="md:hidden" aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
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
    </>
  );
}
