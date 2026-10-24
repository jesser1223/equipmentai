import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { blockedOrganizationResponse } from "@/lib/access-guard";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  const orgId = (session?.user as any)?.organizationId;
  const blocked = blockedOrganizationResponse(session);
  if (blocked) return blocked;
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const jobs = await prisma.job.findMany({
    where: { organizationId: orgId, status: "Completed" },
    include: { invoice: true },
  });

  let totalRevenue = 0;
  let totalFuelCost = 0;
  let jobsWithInvoice = 0;
  let jobsWithoutInvoice = 0;

  for (const job of jobs) {
    if (job.invoice && job.invoice.status !== "Void") {
      totalRevenue += job.invoice.total || 0;
      jobsWithInvoice++;
    } else {
      jobsWithoutInvoice++;
    }
    if (job.fuelCost != null) totalFuelCost += job.fuelCost;
  }

  return NextResponse.json({
    note: "Revenue comes only from non-void linked invoices. Costs shown are recorded fuel costs only. Profitability is incomplete because supplies and maintenance are not yet attributed per job.",
    totalRevenue,
    totalFuelCost,
    jobsWithInvoice,
    jobsWithoutInvoice,
    recordedCosts: totalFuelCost,
  });
}
