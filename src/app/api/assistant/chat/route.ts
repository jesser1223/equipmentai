import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { blockedOrganizationResponse } from "@/lib/access-guard";
import { prisma } from "@/lib/prisma";
import { assistantEntitlementUpdate, billingAccess } from "@/lib/billing";
import { isConfiguredOwner } from "@/lib/owner";
import { runTool, executeConfirmedAction } from "@/lib/ai-tools";
import { AssistantContext, parseRequest } from "@/lib/assistant";

function replyFor(result: any, fallback: string) {
  if (result?.error) return result.error;
  if (result?.confirmationRequired) return "I prepared this, but it is not saved yet. Confirm it to continue.";
  return fallback;
}

function argsFor(parsed: any) {
  return {
    ...parsed,
    name: parsed.name || parsed.customerName,
    query: parsed.customerName || parsed.equipmentName || parsed.jobQuery || "",
    actualHours: parsed.equipmentHours,
    unitNumber: parsed.name?.match(/unit\s+([A-Za-z0-9-]+)/i)?.[1] || parsed.name || "UNIT",
  };
}

export async function POST(req: Request) {
  const session = await auth();
  const orgId = (session?.user as any)?.organizationId;
  const userId = (session?.user as any)?.id;
  const blocked = blockedOrganizationResponse(session);
  if (blocked) return blocked;
  if (!orgId || !userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  const entitlement = assistantEntitlementUpdate(org);
  const current = Object.keys(entitlement.updates).length
    ? await prisma.organization.update({ where: { id: org.id }, data: entitlement.updates })
    : org;
  const access = entitlement.access.allowed ? entitlement.access : billingAccess(current);
  const platformOwnerTesting = isConfiguredOwner(userId) && current.status === "Approved" && access.reason !== "trial-ended" && access.reason !== "grace-expired";
  if (!access.allowed && !platformOwnerTesting) return NextResponse.json({ error: access.message }, { status: 402 });

  const body = await req.json();
  const message = String(body.message || "").trim();
  if (!message) return NextResponse.json({ error: "Message is required." }, { status: 400 });

  const conversation = body.conversationId
    ? await prisma.aiConversation.findFirst({ where: { id: body.conversationId, organizationId: orgId } })
    : await prisma.aiConversation.create({ data: { organizationId: orgId, userId, title: message.slice(0, 80), context: {} } });
  if (!conversation) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });

  const context = (conversation.context || {}) as AssistantContext;
  const parsed = parseRequest(message, context);
  await prisma.aiMessage.create({ data: { conversationId: conversation.id, role: "user", content: message } });

  if (parsed.intent === "confirm") {
    if (!context.pendingActionId) return NextResponse.json({ conversationId: conversation.id, reply: "There is nothing waiting for confirmation." });
    const data = await executeConfirmedAction(context.pendingActionId, orgId);
    const reply = data.error ? data.error : `Saved. ${data.invoiceNumber ? `Invoice ${data.invoiceNumber} is a draft.` : "The action is complete."}`;
    await prisma.aiMessage.create({ data: { conversationId: conversation.id, role: "assistant", content: reply } });
    await prisma.aiConversation.update({ where: { id: conversation.id }, data: { context: { ...context, pendingActionId: undefined } } });
    return NextResponse.json({ conversationId: conversation.id, reply });
  }

  if (parsed.intent === "cancel") {
    await prisma.aiConversation.update({ where: { id: conversation.id }, data: { context: { ...context, pendingActionId: undefined, awaiting: undefined, draft: undefined } } });
    const reply = "Cancelled. Nothing was saved.";
    await prisma.aiMessage.create({ data: { conversationId: conversation.id, role: "assistant", content: reply } });
    return NextResponse.json({ conversationId: conversation.id, reply });
  }

  if (parsed.intent === "unknown") {
    const reply = "I could not reliably understand that. Ask me to create a job or quote, finish a job, check invoices, or show today's work.";
    await prisma.aiMessage.create({ data: { conversationId: conversation.id, role: "assistant", content: reply } });
    return NextResponse.json({ conversationId: conversation.id, reply });
  }

  if (parsed.intent === "help") {
    const reply = "I can create customers, jobs, quotes, equipment, and attachments, schedule maintenance, finish a job after you confirm, check availability, and summarize invoices and today's work. I use your saved rates and do not send email or record payments.";
    await prisma.aiMessage.create({ data: { conversationId: conversation.id, role: "assistant", content: reply } });
    return NextResponse.json({ conversationId: conversation.id, reply });
  }

  const missing = missingFor(parsed);
  if (missing) {
    const next = { ...context, awaiting: missing, draft: parsed, lastCustomer: parsed.customerName, lastEquipment: parsed.equipmentName, lastJob: parsed.jobQuery };
    await prisma.aiConversation.update({ where: { id: conversation.id }, data: { context: next } });
    const reply = `I need the ${missing.replace(/([A-Z])/g, " $1").toLowerCase()} before I can do that.`;
    await prisma.aiMessage.create({ data: { conversationId: conversation.id, role: "assistant", content: reply } });
    return NextResponse.json({ conversationId: conversation.id, reply });
  }

  const tool = toolFor(parsed.intent);
  const result = await runTool(tool, argsFor(parsed), { organizationId: orgId, userId, conversationId: conversation.id }) as any;
  const reply = formatResult(parsed.intent, result);
  const nextContext: AssistantContext = {
    ...context,
    awaiting: undefined,
    draft: undefined,
    lastCustomer: parsed.customerName || context.lastCustomer,
    lastEquipment: parsed.equipmentName || context.lastEquipment,
    lastJob: parsed.jobQuery || context.lastJob,
    pendingActionId: result?.confirmationRequired ? result.actionId : undefined,
  };
  await prisma.aiConversation.update({ where: { id: conversation.id }, data: { context: nextContext } });
  await prisma.aiMessage.create({ data: { conversationId: conversation.id, role: "assistant", content: reply } });
  await prisma.aiUsage.create({
    data: { organizationId: orgId, userId, model: "built-in", status: result?.error ? "failed" : "success", toolCount: 1 },
  });
  return NextResponse.json({ conversationId: conversation.id, reply, pending: result?.confirmationRequired ? [result] : [] });
}

function toolFor(intent: string) {
  const map: Record<string, string> = {
    briefing: "daily_briefing",
    outstanding: "list_outstanding",
    maintenance: "list_maintenance",
    availability: "check_availability",
    find_customer: "search_customers",
    find_job: "search_jobs",
    find_equipment: "search_equipment",
    create_customer: "create_customer",
    create_job: "create_job",
    create_quote: "create_quote",
    create_invoice: "create_invoice_from_job",
    complete_job: "prepare_job_completion",
    schedule_maintenance: "schedule_maintenance",
    add_equipment: "add_equipment",
    add_attachment: "add_attachment",
  };
  return map[intent] || "daily_briefing";
}

function missingFor(parsed: any) {
  if (parsed.intent === "create_customer" && !parsed.name && !parsed.customerName) return "customerName";
  if (parsed.intent === "create_job" && !parsed.customerName) return "customerName";
  if (parsed.intent === "create_quote" && !parsed.customerName) return "customerName";
  if (parsed.intent === "create_quote" && !parsed.equipmentName) return "equipmentName";
  if (parsed.intent === "create_quote" && !parsed.equipmentHours) return "equipmentHours";
  if (parsed.intent === "complete_job" && !parsed.jobQuery) return "jobQuery";
  if (parsed.intent === "complete_job" && !parsed.equipmentHours) return "actualHours";
  if (parsed.intent === "schedule_maintenance" && !parsed.equipmentName) return "equipmentName";
  if (parsed.intent === "schedule_maintenance" && !parsed.date) return "date";
  if (parsed.intent === "add_equipment" && !parsed.name) return "equipmentName";
  if (parsed.intent === "add_attachment" && !parsed.equipmentName) return "equipmentName";
  return null;
}

function formatResult(intent: string, result: any) {
  if (result?.error) return result.error;
  if (result?.confirmationRequired) return "I prepared the job completion and draft invoice. Confirm it before anything is saved.";
  if (intent === "briefing") return `Today: ${(result.today || []).map((j: any) => j.title).join(", ") || "no jobs"}. Outstanding: $${result.outstandingTotal || 0}. Maintenance due: ${result.maintenanceDue || 0}.`;
  if (intent === "outstanding") return `Outstanding balance: $${result.total || 0}. ${(result.invoices || []).map((i: any) => `${i.number} ${i.customer || ""} $${i.balance}`).join("; ") || "None."}`;
  if (intent === "maintenance") return (result.equipment || []).map((e: any) => `${e.name} due ${e.nextMaintenanceDue ? new Date(e.nextMaintenanceDue).toLocaleDateString() : ""}`).join("; ") || "No maintenance is due soon.";
  if (intent === "availability") return (result.equipment || []).map((e: any) => `${e.name}: ${e.available ? "available" : e.status}`).join("; ") || "No matching equipment.";
  if (result?.number) return `Draft quote ${result.number} is ready. Total $${result.total}.`;
  if (result?.invoiceNumber) return `Draft invoice ${result.invoiceNumber} is ready. Total $${result.total}.`;
  if (result?.ok) return `Done. ${result.name || result.title || result.equipment || "Saved"}.`;
  return JSON.stringify(result);
}
