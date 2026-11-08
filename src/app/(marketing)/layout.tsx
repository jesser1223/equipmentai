import Link from "next/link";

const links = [
  { href: "/features", label: "Features" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/pricing", label: "Pricing" },
];

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-bold text-accent-foreground">E</span>
      EquipmentAI
    </Link>
  );
}

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm text-white md:flex">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-foreground">{l.label}</Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="rounded-lg px-3 py-2 text-sm text-white hover:text-foreground">Sign In</Link>
            <Link href="/signup" className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground hover:opacity-90">Get Started</Link>
          </div>
        </div>
        <nav className="flex gap-4 overflow-x-auto px-4 pb-3 text-sm text-white md:hidden">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="whitespace-nowrap hover:text-foreground">{l.label}</Link>
          ))}
        </nav>
      </header>
      <main>{children}</main>
      <footer className="border-t border-border">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-3">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-sm text-white">Equipment management for contractors. Jobs, quotes, invoices, and maintenance in one place.</p>
          </div>
          <div className="flex flex-col gap-2 text-sm text-white">
            {links.map((l) => <Link key={l.href} href={l.href} className="hover:text-foreground">{l.label}</Link>)}
            <Link href="/login" className="hover:text-foreground">Sign In</Link>
            <Link href="/signup" className="hover:text-foreground">Get Started</Link>
          </div>
          <div className="text-sm text-white">
            <div className="font-medium text-foreground">Contact</div>
            <a href="tel:2504670035" className="mt-2 block hover:text-foreground">250-467-0035</a>
          </div>
        </div>
        <div className="border-t border-border px-4 py-4 text-center text-xs text-white">
          © 2026 EquipmentAI
        </div>
      </footer>
    </div>
  );
}
