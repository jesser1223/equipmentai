const NUMBERS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, twelve: 12,
};

export type AssistantContext = {
  pendingActionId?: string;
  awaiting?: string;
  draft?: Record<string, any>;
  lastCustomer?: string;
  lastEquipment?: string;
  lastJob?: string;
};

export function wordsToNumber(text: string) {
  let out = text.toLowerCase();
  for (const [word, value] of Object.entries(NUMBERS)) {
    out = out.replace(new RegExp(`\\b${word}\\b`, "g"), String(value));
  }
  return out;
}

export function detectIntent(raw: string) {
  const text = wordsToNumber(raw);
  if (/^(yes|confirm|go ahead|do it|save it)$/.test(text.trim())) return "confirm";
  if (/^(no|cancel|stop)$/.test(text.trim())) return "cancel";
  if (/(what can you do|help)/.test(text)) return "help";
  if (/(today|briefing|my day|on today)/.test(text)) return "briefing";
  if (/(outstanding|unpaid|owe|receivable)/.test(text)) return "outstanding";
  if (/(maintenance|service due|needs service)/.test(text) && !/(schedule|book|set)/.test(text)) return "maintenance";
  if (/(available|availability|free)/.test(text)) return "availability";
  if (/(finish|complete|wrap up|done with)/.test(text) && /job/.test(text)) return "complete_job";
  if (/(create|make|prepare|generate).*(invoice|bill)/.test(text)) return "create_invoice";
  if (/(create|make|prepare|generate).*(quote|estimate)/.test(text) || /quote for/.test(text)) return "create_quote";
  if (/(schedule|book|create|add).*(maintenance|service)/.test(text)) return "schedule_maintenance";
  if (/(add|create).*(attachment)/.test(text)) return "add_attachment";
  if (/(add|create).*(equipment|machine)/.test(text)) return "add_equipment";
  if (/(add|create).*(customer|client)/.test(text)) return "create_customer";
  if (/(schedule|create|add|book).*(job)/.test(text)) return "create_job";
  if (/(find|search|show|look up).*(customer|client)/.test(text)) return "find_customer";
  if (/(find|search|show|look up).*(job)/.test(text)) return "find_job";
  if (/(find|search|show|list).*(equipment|machine)/.test(text)) return "find_equipment";
  return "unknown";
}

export function extractHours(text: string, label: "equipment" | "attachment") {
  const normalized = wordsToNumber(text);
  const all = [...normalized.matchAll(/(\d+(?:\.\d+)?)\s*hours?(?:\s+(?:of|with|on)\s+(?:the\s+)?([a-z0-9 ]{2,30}))?/g)];
  if (label === "attachment") {
    const specific = normalized.match(/include\s+(\d+(?:\.\d+)?)\s*hours?\s+(?:of\s+)?([a-z0-9 ]{2,30})/);
    return specific ? Number(specific[1]) : null;
  }
  return all[0] ? Number(all[0][1]) : null;
}

export function extractEquipment(text: string) {
  const normalized = wordsToNumber(text);
  const match = normalized.match(/\d+(?:\.\d+)?\s*hours?\s+(?:of|with|on)\s+(?:the\s+)?([a-z0-9][a-z0-9 -]{1,30}?)(?:\s+work|\s+usage|,|\s+and|$)/i);
  return match?.[1]?.trim() || null;
}

export function extractNamed(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].replace(/\b(for|using|with|and|include|including)\b.*$/i, "").trim();
  }
  return null;
}

export function extractDate(text: string) {
  const lower = text.toLowerCase();
  const now = new Date();
  if (/\btoday\b/.test(lower)) return now.toISOString();
  if (/\btomorrow\b/.test(lower)) return new Date(now.getTime() + 86400000).toISOString();
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const found = days.findIndex((d) => lower.includes(d));
  if (found >= 0) {
    const delta = (found - now.getDay() + 7) % 7 || 7;
    return new Date(now.getTime() + delta * 86400000).toISOString();
  }
  const iso = text.match(/\b\d{4}-\d{2}-\d{2}\b/);
  return iso ? new Date(iso[0]).toISOString() : null;
}

export function parseRequest(raw: string, context: AssistantContext = {}) {
  const text = raw.trim();
  const normalized = wordsToNumber(text);
  const intent = context.awaiting && !/^(yes|no|cancel|confirm)/i.test(normalized) ? context.draft?.intent || detectIntent(text) : detectIntent(text);
  const followUp = context.awaiting ? text.trim() : null;
  const customer = extractNamed(text, [/for ([A-Z][\w&.' -]{2,40})/, /customer ([A-Z][\w&.' -]{2,40})/, /client ([A-Z][\w&.' -]{2,40})/]) || (context.awaiting === "customerName" ? followUp : null) || context.lastCustomer;
  const equipment = extractEquipment(normalized) || extractNamed(normalized, [/equipment ([a-z0-9][\w -]{2,30})/i]) || context.lastEquipment;
  const attachment = extractNamed(normalized, [/include (?:\d+(?:\.\d+)?)\s*hours? of ([a-z][\w -]{2,30})/i, /attachment ([a-z][\w -]{2,30})/i]);
  const jobQuery = extractNamed(text, [/(?:finish|complete|invoice|job) (?:the )?([A-Za-z][\w -]{2,40}?) job/i, /job ([A-Za-z][\w -]{2,40})/i]) || context.lastJob;
  return {
    intent,
    customerName: customer,
    equipmentName: equipment,
    attachmentName: attachment,
    equipmentHours: extractHours(text, "equipment"),
    attachmentHours: extractHours(text, "attachment"),
    jobQuery,
    startDate: extractDate(text),
    date: extractDate(text),
    title: extractNamed(text, [/job (?:for|called|named) ([A-Za-z0-9][\w -]{2,40})/i]) || (customer ? `${customer} job` : null),
    name: extractNamed(text, [/(?:customer|client|equipment|attachment) ([A-Za-z0-9][\w -]{2,40})/i]),
  };
}
