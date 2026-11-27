import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { blockedOrganizationResponse } from "@/lib/access-guard";
import { prisma } from "@/lib/prisma";
import { GROK_MODEL, grokChat, grokConfigured } from "@/lib/grok";
import { estimatedCostUsd, monthStart, monthlyLimit } from "@/lib/ai-budget";
import { runTool, toolDefinitions } from "@/lib/ai-tools";
import { billingAccess } from "@/lib/billing";

const SYSTEM = `You are EquipmentAI's administrative assistant for one equipment contractor.
Use the provided tools to look up and create records. Never invent customers, rates, hours, or totals.
Only operate on the current company. If a tool requires confirmation, stop and ask the user to confirm.
Do not send emails, record payments, delete records, or change billing. Drafts are allowed when requested.
If information is missing, ask one concise question.`;

export async function POST(req: Request) {
  const session = await auth();
  const orgId = (session?.user as any)?.organizationId;
  const userId = (session?.user as any)?.id;
  const blocked = blockedOrganizationResponse(session);
  if (blocked) return blocked;
  if (!orgId || !userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!grokConfigured()) return NextResponse.json({ error: "AI is not configured. Add XAI_API_KEY in Vercel." }, { status: 503 });

  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  const access = billingAccess(org);
  if (!access.allowed) return NextResponse.json({ error: access.message }, { status: 402 });

  const used = await prisma.aiUsage.aggregate({
    where: { organizationId: orgId, createdAt: { gte: monthStart() }, status: "success" },
    _sum: { inputTokens: true, outputTokens: true },
  });
  const usedTokens = (used._sum.inputTokens || 0) + (used._sum.outputTokens || 0);
  const limit = monthlyLimit(org.subscriptionStatus === "trialing");
  if (usedTokens >= limit) {
    return NextResponse.json({ error: "This company's AI allowance for the month has been used." }, { status: 429 });
  }

  const body = await req.json();
  const message = String(body.message || "").trim();
  if (!message) return NextResponse.json({ error: "Message is required." }, { status: 400 });

  const conversation = body.conversationId
    ? await prisma.aiConversation.findFirst({ where: { id: body.conversationId, organizationId: orgId } })
    : await prisma.aiConversation.create({ data: { organizationId: orgId, userId, title: message.slice(0, 80) } });
  if (!conversation) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });

  await prisma.aiMessage.create({ data: { conversationId: conversation.id, role: "user", content: message } });
  const history = await prisma.aiMessage.findMany({ where: { conversationId: conversation.id }, orderBy: { createdAt: "asc" }, take: 20 });

  const messages: any[] = [
    { role: "system", content: SYSTEM },
    ...history.map((m) => ({ role: m.role === "tool" ? "assistant" : m.role, content: m.content })),
  ];

  let totalIn = 0;
  let totalOut = 0;
  let toolCount = 0;
  let final = "";
  const pending: any[] = [];

  try {
    for (let step = 0; step < 5; step++) {
      const result = await grokChat(messages, toolDefinitions);
      totalIn += result.usage.prompt_tokens || 0;
      totalOut += result.usage.completion_tokens || 0;
      const calls = result.message.tool_calls || [];
      if (!calls.length) {
        final = result.message.content || "";
        break;
      }
      messages.push(result.message);
      for (const call of calls) {
        toolCount += 1;
        let args: any = {};
        try { args = JSON.parse(call.function?.arguments || "{}"); } catch { args = {}; }
        const output = await runTool(call.function.name, args, { organizationId: orgId, userId, conversationId: conversation.id });
        if ((output as any)?.confirmationRequired) pending.push(output);
        messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(output) });
      }
    }
    if (!final) {
      const result = await grokChat(messages, []);
      totalIn += result.usage.prompt_tokens || 0;
      totalOut += result.usage.completion_tokens || 0;
      final = result.message.content || "Done.";
    }
    await prisma.aiMessage.create({ data: { conversationId: conversation.id, role: "assistant", content: final } });
    await prisma.aiUsage.create({
      data: {
        organizationId: orgId, userId, model: GROK_MODEL,
        inputTokens: totalIn, outputTokens: totalOut,
        estimatedCostUsd: estimatedCostUsd(totalIn, totalOut),
        toolCount, status: "success",
      },
    });
    return NextResponse.json({ conversationId: conversation.id, reply: final, pending });
  } catch (err: any) {
    await prisma.aiUsage.create({
      data: { organizationId: orgId, userId, model: GROK_MODEL, status: "failed", estimatedCostUsd: estimatedCostUsd(totalIn, totalOut), inputTokens: totalIn, outputTokens: totalOut },
    });
    return NextResponse.json({ error: err.message || "AI request failed." }, { status: 502 });
  }
}
