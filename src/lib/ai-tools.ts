import { prisma } from "@/lib/prisma";
import { calculateJobCharges } from "@/lib/job-billing";
import { invoiceTotals } from "@/lib/invoice-calc";

type Ctx = { organizationId: string; userId: string; conversationId: string };

const CONFIRM = new Set(["complete_job"]);

export const toolDefinitions = [
  { type: "function", function: { name: "search_customers", description: "Search this company's customers by name.", parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } } },
  { type: "function", function: { name: "create_customer", description: "Create a customer for this company.", parameters: { type: "object", properties: { name: { type: "string" }, email: { type: "string" }, phone: { type: "string" }, company: { type: "string" }, address: { type: "string" } }, required: ["name"] } } },
  { type: "function", function: { name: "search_equipment", description: "Search this company's equipment and rates.", parameters: { type: "object", properties: { query: { type: "string" } } } } },
  { type: "function", function: { name: "search_jobs", description: "Search this company's jobs.", parameters: { type: "object", properties: { query: { type: "string" }, status: { type: "string" } } } } },
  { type: "function", function: { name: "create_job", description: "Create a scheduled job. Does not complete it or invoice it.", parameters: { type: "object", properties: { title: { type: "string" }, customerName: { type: "string" }, equipmentName: { type: "string" }, startDate: { type: "string" }, location: { type: "string" }, notes: { type: "string" } }, required: ["title", "customerName"] } } },
  { type: "function", function: { name: "create_quote", description: "Create a draft quote using saved equipment and attachment rates. Never invent rates.", parameters: { type: "object", properties: { customerName: { type: "string" }, jobName: { type: "string" }, equipmentName: { type: "string" }, equipmentHours: { type: "number" }, attachmentName: { type: "string" }, attachmentHours: { type: "number" }, location: { type: "string" } }, required: ["customerName", "jobName", "equipmentName", "equipmentHours"] } } },
  { type: "function", function: { name: "list_outstanding", description: "List outstanding invoices and the total balance.", parameters: { type: "object", properties: {} } } },
  { type: "function", function: { name: "list_maintenance", description: "List equipment with overdue or due-soon maintenance.", parameters: { type: "object", properties: {} } } },
  { type: "function", function: { name: "daily_briefing", description: "Summarize today's jobs, outstanding invoices, and maintenance that needs attention.", parameters: { type: "object", properties: {} } } },
  { type: "function", function: { name: "prepare_job_completion", description: "Prepare job completion and a draft invoice. Requires user confirmation before saving.", parameters: { type: "object", properties: { jobQuery: { type: "string" }, actualHours: { type: "number" }, attachmentHours: { type: "number" }, notes: { type: "string" } }, required: ["jobQuery", "actualHours"] } } },
];

export async function runTool(name: string, args: any, ctx: Ctx) {
  if (CONFIRM.has(name) || name === "prepare_job_completion") {
    return prepareConfirmation(name, args, ctx);
  }
  switch (name) {
    case "search_customers": return searchCustomers(ctx.organizationId, args.query);
    case "create_customer": return createCustomer(ctx.organizationId, args);
    case "search_equipment": return searchEquipment(ctx.organizationId, args.query);
    case "search_jobs": return searchJobs(ctx.organizationId, args);
    case "create_job": return createJob(ctx.organizationId, args);
    case "create_quote": return createQuote(ctx.organizationId, args);
    case "list_outstanding": return listOutstanding(ctx.organizationId);
    case "list_maintenance": return listMaintenance(ctx.organizationId);
    case "daily_briefing": return dailyBriefing(ctx.organizationId);
    case "check_availability": return checkAvailability(ctx.organizationId, args.query);
    case "schedule_maintenance": return scheduleMaintenance(ctx.organizationId, args);
    case "add_equipment": return addEquipment(ctx.organizationId, args);
    case "add_attachment": return addAttachment(ctx.organizationId, args);
    case "create_invoice_from_job": return createInvoiceFromCompleted(ctx.organizationId, args);
    case "reschedule_job": return rescheduleJob(ctx.organizationId, args);
    case "get_rates": return getRates(ctx.organizationId, args);
    case "convert_quote": return convertQuote(ctx.organizationId, args);
    default: return { error: `Unknown tool: ${name}` };
  }
}

async function prepareConfirmation(tool: string, args: any, ctx: Ctx) {
  const preview: any = tool === "prepare_job_completion"
    ? await previewCompletion(ctx.organizationId, args)
    : { args };
  if (preview.error) return preview;
  const action = await prisma.aiAction.create({
    data: {
      tool,
      payload: preview,
      status: "pending",
      idempotencyKey: `${ctx.conversationId}:${tool}:${Date.now()}`,
      conversationId: ctx.conversationId,
      organizationId: ctx.organizationId,
      userId: ctx.userId,
    },
  });
  return {
    confirmationRequired: true,
    actionId: action.id,
    preview,
    message: "This changes records. Ask the user to confirm before it is saved.",
  };
}

async function previewCompletion(orgId: string, args: any) {
  const job = await findJob(orgId, args.jobQuery);
  if (!job) return { error: "No matching job found." };
  if (job.status === "Completed") return { error: "That job is already completed." };
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  const charges = calculateJobCharges({
    equipmentName: job.equipment?.name,
    equipmentUnit: job.equipment?.unitNumber,
    equipmentRate: job.quotedEquipmentRate || job.equipment?.hourlyRate || 0,
    actualHours: Number(args.actualHours),
    taxRate: org?.taxRate || 0,
  });
  if (charges.missing.length) return { error: `Missing: ${charges.missing.join(", ")}. Configure the rate before completing.` };
  return {
    jobId: job.id,
    title: job.title,
    customer: job.customer?.name,
    actualHours: Number(args.actualHours),
    notes: args.notes || null,
    charges,
    links: { job: `/schedule`, invoice: null },
  };
}

export async function executeConfirmedAction(actionId: string, orgId: string) {
  const action = await prisma.aiAction.findFirst({ where: { id: actionId, organizationId: orgId } });
  if (!action) return { error: "Action not found." };
  if (action.status === "completed") return { alreadyDone: true, result: action.result };
  if (action.status !== "pending") return { error: `Action is ${action.status}.` };
  const payload = action.payload as any;
  let result: any;
  if (action.tool === "prepare_job_completion" || action.tool === "complete_job") {
    result = await completeAndInvoice(orgId, payload);
  } else {
    result = { error: "This action cannot be confirmed." };
  }
  await prisma.aiAction.update({
    where: { id: action.id },
    data: { status: result.error ? "failed" : "completed", result, executedAt: new Date() },
  });
  return result;
}

async function completeAndInvoice(orgId: string, payload: any) {
  const job = await prisma.job.findFirst({ where: { id: payload.jobId, organizationId: orgId }, include: { equipment: true, customer: true, invoice: true } });
  if (!job) return { error: "Job not found." };
  if (job.status === "Completed") return { error: "Job is already completed." };
  if (job.invoice) return { error: "This job already has an invoice." };
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  const charges = payload.charges || calculateJobCharges({
    equipmentName: job.equipment?.name,
    equipmentRate: job.quotedEquipmentRate || job.equipment?.hourlyRate || 0,
    actualHours: payload.actualHours,
    taxRate: org?.taxRate || 0,
  });
  const count = await prisma.invoice.count({ where: { organizationId: orgId } });
  const number = `${org?.invoicePrefix || "INV"}-${String((org?.nextInvoiceNum || count + 1)).padStart(4, "0")}`;
  const invoice = await prisma.$transaction(async (tx) => {
    await tx.job.update({
      where: { id: job.id },
      data: {
        status: "Completed",
        completedAt: new Date(),
        actualHours: payload.actualHours,
        completionNotes: payload.notes || null,
      },
    });
    if (job.equipment && payload.actualHours) {
      await tx.equipment.update({
        where: { id: job.equipment.id },
        data: { hourMeter: (job.equipment.hourMeter || 0) + payload.actualHours },
      });
    }
    return tx.invoice.create({
      data: {
        number,
        status: "Draft",
        organizationId: orgId,
        customerId: job.customerId,
        jobId: job.id,
        subtotal: charges.subtotal,
        taxRate: charges.taxRate,
        taxAmount: charges.taxAmount,
        total: charges.total,
        lines: { create: charges.lines.map((l: any) => ({ description: l.description, quantity: l.quantity, unit: l.unit, rate: l.rate, amount: l.amount })) },
      },
    });
  });
  return { ok: true, jobId: job.id, invoiceId: invoice.id, invoiceNumber: invoice.number, total: invoice.total, status: "Draft", link: `/invoices` };
}

async function searchCustomers(orgId: string, query: string) {
  const customers = await prisma.customer.findMany({
    where: { organizationId: orgId, archivedAt: null, name: { contains: query || "", mode: "insensitive" } },
    take: 10,
    select: { id: true, name: true, email: true, phone: true, company: true },
  });
  return { customers };
}

async function createCustomer(orgId: string, args: any) {
  const name = String(args.name || "").trim();
  if (!name) return { error: "Customer name is required." };
  const customer = await prisma.customer.create({
    data: { name, email: args.email || null, phone: args.phone || null, company: args.company || null, address: args.address || null, organizationId: orgId },
  });
  return { ok: true, customerId: customer.id, name: customer.name, link: "/customers" };
}

async function searchEquipment(orgId: string, query?: string) {
  const equipment = await prisma.equipment.findMany({
    where: { organizationId: orgId, ...(query ? { name: { contains: query, mode: "insensitive" } } : {}) },
    take: 15,
    include: { attachments: { select: { id: true, name: true, rate: true, billingMethod: true } } },
  });
  return {
    equipment: equipment.map((e) => ({
      id: e.id, name: e.name, unitNumber: e.unitNumber, status: e.status,
      hourlyRate: e.hourlyRate, dailyRate: e.dailyRate, hourMeter: e.hourMeter,
      attachments: e.attachments,
    })),
  };
}

async function searchJobs(orgId: string, args: any) {
  const jobs = await prisma.job.findMany({
    where: {
      organizationId: orgId,
      ...(args.status ? { status: args.status } : {}),
      ...(args.query ? { title: { contains: args.query, mode: "insensitive" } } : {}),
    },
    take: 15,
    include: { customer: { select: { name: true } }, equipment: { select: { name: true } } },
    orderBy: { startDate: "desc" },
  });
  return { jobs: jobs.map((j) => ({ id: j.id, title: j.title, status: j.status, startDate: j.startDate, customer: j.customer?.name, equipment: j.equipment?.name })) };
}

async function createJob(orgId: string, args: any) {
  const customer = await findCustomer(orgId, args.customerName);
  if (!customer) return { error: `No customer matching "${args.customerName}".` };
  const equipment = args.equipmentName ? await findEquipment(orgId, args.equipmentName) : null;
  const job = await prisma.job.create({
    data: {
      title: String(args.title).trim(),
      organizationId: orgId,
      customerId: customer.id,
      equipmentId: equipment?.id || null,
      startDate: args.startDate ? new Date(args.startDate) : null,
      location: args.location || null,
      notes: args.notes || null,
      status: "Scheduled",
    },
  });
  return { ok: true, jobId: job.id, title: job.title, link: "/schedule" };
}

async function createQuote(orgId: string, args: any) {
  const customer = await findCustomer(orgId, args.customerName);
  if (!customer) return { error: `No customer matching "${args.customerName}".` };
  const equipment = await findEquipment(orgId, args.equipmentName);
  if (!equipment) return { error: `No equipment matching "${args.equipmentName}".` };
  if (!equipment.hourlyRate) return { error: `${equipment.name} has no hourly rate configured.` };
  const hours = Number(args.equipmentHours);
  if (!hours || hours < 0) return { error: "Equipment hours must be a positive number." };
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  const lines: any[] = [{
    description: `${equipment.name} – ${hours} hours`,
    quantity: hours, unit: "hours", rate: equipment.hourlyRate, amount: Math.round(hours * equipment.hourlyRate * 100) / 100,
    equipmentId: equipment.id, lineType: "equipment", billingMethod: "hourly",
  }];
  if (args.attachmentName) {
    const attachment = await prisma.attachment.findFirst({ where: { organizationId: orgId, equipmentId: equipment.id, name: { contains: args.attachmentName, mode: "insensitive" } } });
    if (!attachment) return { error: `No attachment matching "${args.attachmentName}" on ${equipment.name}.` };
    if (!attachment.rate) return { error: `${attachment.name} has no rate configured.` };
    const ah = Number(args.attachmentHours || 0);
    if (ah <= 0) return { error: "Attachment hours are required when an attachment is included." };
    lines.push({
      description: `${attachment.name} – ${ah} hours`,
      quantity: ah, unit: "hours", rate: attachment.rate, amount: Math.round(ah * attachment.rate * 100) / 100,
      attachmentId: attachment.id, lineType: "attachment", billingMethod: attachment.billingMethod || "hourly", attachmentName: attachment.name,
    });
  }
  const subtotal = Math.round(lines.reduce((s, l) => s + l.amount, 0) * 100) / 100;
  const totals = invoiceTotals(subtotal, org?.taxRate || 0);
  const count = await prisma.quote.count({ where: { organizationId: orgId } });
  const quote = await prisma.quote.create({
    data: {
      number: `Q-${String(count + 1).padStart(4, "0")}`,
      jobName: args.jobName,
      location: args.location || null,
      status: "Draft",
      organizationId: orgId,
      customerId: customer.id,
      subtotal: totals.subtotal,
      taxRate: org?.taxRate || 0,
      taxAmount: totals.taxAmount,
      total: totals.total,
      lines: { create: lines },
    },
  });
  return { ok: true, quoteId: quote.id, number: quote.number, total: quote.total, status: "Draft", link: `/quotes/${quote.id}` };
}

async function listOutstanding(orgId: string) {
  const invoices = await prisma.invoice.findMany({
    where: { organizationId: orgId, status: { notIn: ["Paid", "Void", "Draft"] } },
    include: { customer: { select: { name: true } } },
    take: 20,
  });
  const total = Math.round(invoices.reduce((s, i) => s + Math.max(0, i.total - i.amountPaid), 0) * 100) / 100;
  return { total, invoices: invoices.map((i) => ({ id: i.id, number: i.number, customer: i.customer?.name, total: i.total, paid: i.amountPaid, balance: Math.round((i.total - i.amountPaid) * 100) / 100, status: i.status })) };
}

async function listMaintenance(orgId: string) {
  const now = new Date();
  const soon = new Date(now.getTime() + 14 * 86400000);
  const equipment = await prisma.equipment.findMany({
    where: { organizationId: orgId, nextMaintenanceDue: { lte: soon } },
    select: { id: true, name: true, unitNumber: true, nextMaintenanceDue: true, hourMeter: true },
  });
  return { equipment };
}

async function checkAvailability(orgId: string, query?: string) {
  const equipment = await prisma.equipment.findMany({
    where: { organizationId: orgId, ...(query ? { name: { contains: query, mode: "insensitive" } } : {}) },
    include: { jobs: { where: { status: { in: ["Scheduled", "In Progress"] } }, select: { title: true, startDate: true, status: true } } },
    take: 15,
  });
  return {
    equipment: equipment.map((e) => ({
      name: e.name,
      unitNumber: e.unitNumber,
      status: e.status,
      scheduledJobs: e.jobs,
      available: e.status === "Available" && e.jobs.length === 0,
    })),
  };
}

async function scheduleMaintenance(orgId: string, args: any) {
  const equipment = await findEquipment(orgId, args.equipmentName);
  if (!equipment) return { error: `No equipment matching "${args.equipmentName}".` };
  const date = args.date ? new Date(args.date) : null;
  if (!date || isNaN(date.getTime())) return { error: "A valid service date is required." };
  const record = await prisma.maintenanceRecord.create({
    data: {
      equipmentId: equipment.id,
      organizationId: orgId,
      serviceDate: date,
      category: args.category || "Scheduled service",
      description: args.notes || "Scheduled from assistant",
      totalCost: 0,
      nextServiceDate: date,
    },
  });
  await prisma.equipment.update({ where: { id: equipment.id }, data: { nextMaintenanceDue: date } });
  return { ok: true, equipment: equipment.name, date: date.toISOString(), recordId: record.id, link: "/maintenance" };
}

async function addEquipment(orgId: string, args: any) {
  const name = String(args.name || "").trim();
  const unitNumber = String(args.unitNumber || "").trim();
  if (!name || !unitNumber) return { error: "Equipment name and unit number are required." };
  const existing = await prisma.equipment.findFirst({ where: { organizationId: orgId, unitNumber } });
  if (existing) return { error: `Unit number ${unitNumber} is already used.` };
  const equipment = await prisma.equipment.create({
    data: {
      name,
      unitNumber,
      category: args.category || "Equipment",
      hourlyRate: Number(args.hourlyRate || 0),
      dailyRate: Number(args.dailyRate || 0),
      organizationId: orgId,
    },
  });
  return { ok: true, equipmentId: equipment.id, name: equipment.name, link: `/equipment/${equipment.id}` };
}

async function addAttachment(orgId: string, args: any) {
  const equipment = await findEquipment(orgId, args.equipmentName);
  if (!equipment) return { error: `No equipment matching "${args.equipmentName}".` };
  const name = String(args.name || "").trim();
  if (!name) return { error: "Attachment name is required." };
  const attachment = await prisma.attachment.create({
    data: {
      name,
      equipmentId: equipment.id,
      organizationId: orgId,
      rate: Number(args.rate || 0),
      billingMethod: args.billingMethod || "hourly",
    },
  });
  return { ok: true, attachmentId: attachment.id, name: attachment.name, equipment: equipment.name };
}

async function createInvoiceFromCompleted(orgId: string, args: any) {
  const job = await findJob(orgId, args.jobQuery);
  if (!job) return { error: "No matching job found." };
  if (job.status !== "Completed") return { error: "The job must be completed before an invoice draft can be created." };
  if (!job.actualHours) return { error: "That job has no saved actual hours." };
  if (job.invoice) return { error: "That job already has an invoice." };
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  const charges = calculateJobCharges({
    equipmentName: job.equipment?.name,
    equipmentUnit: job.equipment?.unitNumber,
    equipmentRate: job.quotedEquipmentRate || job.equipment?.hourlyRate || 0,
    actualHours: job.actualHours,
    taxRate: org?.taxRate || 0,
  });
  if (charges.missing.length) return { error: `Missing: ${charges.missing.join(", ")}.` };
  const count = await prisma.invoice.count({ where: { organizationId: orgId } });
  const number = `${org?.invoicePrefix || "INV"}-${String((org?.nextInvoiceNum || count + 1)).padStart(4, "0")}`;
  const invoice = await prisma.invoice.create({
    data: {
      number,
      status: "Draft",
      organizationId: orgId,
      customerId: job.customerId,
      jobId: job.id,
      subtotal: charges.subtotal,
      taxRate: charges.taxRate,
      taxAmount: charges.taxAmount,
      total: charges.total,
      lines: { create: charges.lines.map((l) => ({ description: l.description, quantity: l.quantity, unit: l.unit, rate: l.rate, amount: l.amount })) },
    },
  });
  return { ok: true, invoiceId: invoice.id, invoiceNumber: invoice.number, total: invoice.total, status: "Draft", link: "/invoices" };
}

async function rescheduleJob(orgId: string, args: any) {
  const job = await findJob(orgId, args.jobQuery || args.customerName);
  if (!job) return { error: "No matching job found." };
  if (!args.startDate) return { error: "A new date is required." };
  const updated = await prisma.job.update({ where: { id: job.id }, data: { startDate: new Date(args.startDate) } });
  return { ok: true, title: updated.title, startDate: updated.startDate, link: "/schedule" };
}

async function getRates(orgId: string, args: any) {
  const equipment = args.equipmentName || args.query ? await findEquipment(orgId, args.equipmentName || args.query) : null;
  if (equipment) return { equipment: equipment.name, hourlyRate: equipment.hourlyRate, dailyRate: equipment.dailyRate };
  return searchEquipment(orgId, args.query);
}

async function convertQuote(orgId: string, args: any) {
  const quote = await prisma.quote.findFirst({
    where: { organizationId: orgId, OR: [{ jobName: { contains: args.jobQuery || args.customerName || "", mode: "insensitive" } }, { customer: { name: { contains: args.customerName || "", mode: "insensitive" } } }] },
    include: { job: true, lines: true, customer: true },
  });
  if (!quote) return { error: "No matching quote found." };
  if (quote.job) return { error: "That quote is already a job." };
  if (quote.status !== "Accepted") return { error: "Accept the quote before converting it to a job." };
  const equipmentLine = quote.lines.find((l) => l.lineType === "equipment");
  const job = await prisma.job.create({
    data: {
      title: quote.jobName,
      organizationId: orgId,
      customerId: quote.customerId,
      quoteId: quote.id,
      equipmentId: equipmentLine?.equipmentId || null,
      startDate: args.startDate ? new Date(args.startDate) : quote.proposedDate,
      location: quote.location,
      status: "Scheduled",
      quotedEquipmentRate: equipmentLine?.rate ?? null,
    },
  });
  return { ok: true, title: job.title, jobId: job.id, link: "/schedule" };
}

async function dailyBriefing(orgId: string) {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const end = new Date(); end.setHours(23, 59, 59, 999);
  const [jobs, outstanding, maintenance] = await Promise.all([
    prisma.job.findMany({ where: { organizationId: orgId, startDate: { gte: start, lte: end } }, include: { customer: { select: { name: true } }, equipment: { select: { name: true } } } }),
    listOutstanding(orgId),
    listMaintenance(orgId),
  ]);
  return {
    today: jobs.map((j) => ({ title: j.title, status: j.status, customer: j.customer?.name, equipment: j.equipment?.name })),
    outstandingTotal: outstanding.total,
    maintenanceDue: maintenance.equipment.length,
  };
}

async function findCustomer(orgId: string, name: string) {
  return prisma.customer.findFirst({ where: { organizationId: orgId, archivedAt: null, name: { contains: name, mode: "insensitive" } } });
}
async function findEquipment(orgId: string, name: string) {
  return prisma.equipment.findFirst({ where: { organizationId: orgId, name: { contains: name, mode: "insensitive" } } });
}
async function findJob(orgId: string, query: string) {
  return prisma.job.findFirst({
    where: { organizationId: orgId, OR: [{ title: { contains: query, mode: "insensitive" } }, { customer: { name: { contains: query, mode: "insensitive" } } }] },
    include: { equipment: true, customer: true, invoice: true },
  });
}
