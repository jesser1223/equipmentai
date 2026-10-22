import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { canAccessApp } from "@/lib/access";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = session?.user as any;
  if (user && !canAccessApp(user.organizationStatus, !!user.isOwner)) {
    redirect(user.organizationStatus === "Pending" ? "/pending" : "/denied");
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
