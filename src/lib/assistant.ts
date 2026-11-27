export type AssistantContext = {
  pendingActionId?: string;
  awaiting?: string;
  draft?: Draft;
  lastCustomer?: string;
  lastEquipment?: string;
  lastJob?: string;
  lastIntent?: string;
};

export type Draft = {
  intent: string;
  customerName?: string;
  equipmentName?: string;
  attachmentName?: string;
  equipmentHours?: number | null;
  attachmentHours?: number | null;
  jobQuery?: string;
  startDate?: string | null;
  startTime?: string | null;
  title?: string;
  name?: string;
  rate?: number | null;
  notes?: string;
};

export type CompanyRecords = {
  customers?: string[];
  equipment?: string[];
  attachments?: string[];
};

const NUMBERS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
};

const TYPOS: Record<string, string> = {
  tomorow: "tomorrow", tommorow: "tomorrow", tommorrow: "tomorrow", tmrw: "tomorrow", tmr: "tomorrow",
  schedual: "schedule", scedule: "schedule", shedule: "schedule",
  exavator: "excavator", excavtor: "excavator", exacavator: "excavator", hoe: "excavator",
  skidsteer: "skid steer", loader: "wheel loader",
  invoce: "invoice", invioce: "invoice", qoute: "quote", quoote: "quote",
  custmer: "customer", custoemr: "customer", maintenence: "maintenance", maintainance: "maintenance",
  availble: "available", avaliable: "available", attatchment: "attachment", attachement: "attachment",
  brak: "breaker", hydrualic: "hydraulic",
};

const NICKNAMES: Record<string, string> = {
  cat: "caterpillar", caterpiller: "caterpillar", jd: "john deere", deere: "john deere",
  skid: "skid steer", bobcat: "skid steer", breaker: "hydraulic breaker", hoe: "excavator",
};

const INTENT_CUES: Record<string, string[]> = {
  confirm: ["yes", "confirm", "go ahead", "do it", "save it", "that's right", "thats right", "ok", "okay"],
  cancel: ["no", "cancel", "stop", "never mind", "nevermind"],
  help: ["what can you do", "help", "how do i"],
  briefing: ["today", "briefing", "my day", "what's on", "whats on", "on today", "this morning"],
  outstanding: ["outstanding", "unpaid", "owe", "owes", "receivable", "who hasn't paid", "who hasnt paid"],
  maintenance: ["maintenance", "service due", "needs service", "due for service"],
  availability: ["available", "availability", "free", "booked"],
  rates: ["rate", "rates", "how much", "what does it cost", "hourly"],
  complete_job: ["finish", "complete", "wrap up", "done with", "we worked", "worked"],
  create_invoice: ["invoice", "bill", "make the invoice", "generate invoice"],
  create_quote: ["quote", "estimate"],
  schedule_maintenance: ["schedule maintenance", "book service", "set service", "maintenance on"],
  add_attachment: ["add attachment", "new attachment", "attachment to"],
  add_equipment: ["add equipment", "new machine", "add machine", "new equipment"],
  create_customer: ["add customer", "new customer", "add client", "new client"],
  reschedule_job: ["reschedule", "move", "change it to", "make it friday", "make it monday", "actually make it"],
  convert_quote: ["convert", "turn into a job", "make a job from"],
  create_job: ["job", "book", "schedule", "put down", "booked in", "some work", "work for", "book in"],
  find_customer: ["find customer", "search customer", "show customer", "look up customer"],
  find_job: ["find job", "show jobs", "search job"],
  find_equipment: ["find equipment", "show equipment", "list equipment", "show machines"],
};

export function normalize(raw: string) {
  let text = raw.toLowerCase().replace(/[’']/g, "'").replace(/\$/g, " $ ").replace(/\s+/g, " ").trim();
  text = text.replace(/\b(tmrw|tmr)\b/g, "tomorrow");
  for (const [bad, good] of Object.entries(TYPOS)) text = text.replace(new RegExp(`\\b${bad}\\b`, "g"), good);
  for (const [word, value] of Object.entries(NUMBERS)) text = text.replace(new RegExp(`\\b${word}\\b`, "g"), String(value));
  return text;
}

export function detectIntent(raw: string, context: AssistantContext = {}) {
  const text = normalize(raw);
  if (context.awaiting && text.split(" ").length <= 6 && !hasStrongNewIntent(text)) return context.draft?.intent || context.lastIntent || "unknown";
  if (/^(yes|confirm|go ahead|do it|save it|ok|okay|that's right|thats right)$/.test(text)) return "confirm";
  if (/^(no|cancel|stop|never mind|nevermind)$/.test(text)) return "cancel";
  if (/(actually|change that|make it|use the other|add the)/.test(text) && context.draft) return context.draft.intent || "reschedule_job";
  const scores: Record<string, number> = {};
  for (const [intent, cues] of Object.entries(INTENT_CUES)) {
    scores[intent] = cues.reduce((score, cue) => score + (text.includes(cue) ? cue.split(" ").length : 0), 0);
  }
  if (/(book|schedule|put).*(tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/.test(text)) scores.create_job = (scores.create_job || 0) + 3;
  if (/we worked|worked \d+/.test(text)) scores.complete_job = (scores.complete_job || 0) + 3;
  if (/invoice|bill/.test(text) && /make|create|generate|prepare/.test(text)) scores.create_invoice = (scores.create_invoice || 0) + 3;
  if (/convert|turn into a job|into a job/.test(text)) scores.convert_quote = (scores.convert_quote || 0) + 5;
  const ranked = Object.entries(scores).filter(([, score]) => score > 0).sort((a, b) => b[1] - a[1]);
  return ranked[0]?.[0] || "unknown";
}

function hasStrongNewIntent(text: string) {
  return /(invoice|quote|job|book|schedule|finish|complete|maintenance|customer|equipment)/.test(text);
}

export function extractDate(text: string, now = new Date()) {
  const lower = normalize(text);
  if (/\btoday\b/.test(lower)) return startOfDay(now).toISOString();
  if (/\btomorrow\b/.test(lower)) return startOfDay(addDays(now, 1)).toISOString();
  const inDays = lower.match(/\bin (\d+) days?\b/);
  if (inDays) return startOfDay(addDays(now, Number(inDays[1]))).toISOString();
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const found = days.findIndex((d) => lower.includes(d));
  if (found >= 0) {
    const delta = (found - now.getDay() + 7) % 7 || 7;
    return startOfDay(addDays(now, delta)).toISOString();
  }
  const iso = text.match(/\b\d{4}-\d{2}-\d{2}\b/);
  return iso ? new Date(iso[0]).toISOString() : null;
}

export function extractTime(text: string) {
  const lower = normalize(text);
  const clock = lower.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/);
  if (clock && Number(clock[1]) <= 23 && (clock[3] || Number(clock[1]) <= 12 || lower.includes("start") || lower.includes("at"))) {
    let hour = Number(clock[1]);
    const minute = clock[2] || "00";
    if (clock[3] === "pm" && hour < 12) hour += 12;
    if (clock[3] === "am" && hour === 12) hour = 0;
    if (!clock[3] && hour <= 7) hour += 12;
    return `${String(hour).padStart(2, "0")}:${minute}`;
  }
  if (/\bmorning\b/.test(lower)) return "08:00";
  if (/\bafternoon\b/.test(lower)) return "13:00";
  if (/\bevening\b/.test(lower)) return "17:00";
  return null;
}

export function extractHours(text: string) {
  const lower = normalize(text);
  const matches = [...lower.matchAll(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)\b/g)].map((m) => Number(m[1]));
  return matches;
}

export function extractMoney(text: string) {
  const match = normalize(text).match(/\b(\d+(?:\.\d+)?)\s*(?:an hour|\/hour|per hour|hourly)\b/) || text.match(/\$\s*(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : null;
}

export function levenshtein(a: string, b: string) {
  const m = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) m[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return m[a.length][b.length];
}

export function bestMatch(query: string | null | undefined, options: string[] = []) {
  if (!query) return null;
  const q = normalize(query);
  let best: { value: string; score: number } | null = null;
  for (const option of options) {
    const name = normalize(option);
    if (name.includes(q) || q.includes(name)) return option;
    const distance = levenshtein(q, name);
    const score = 1 - distance / Math.max(q.length, name.length);
    if (!best || score > best.score) best = { value: option, score };
  }
  return best && best.score >= 0.62 ? best.value : null;
}

export function extractCandidate(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = normalize(text).match(pattern);
    if (match?.[1]) return cleanName(match[1]);
  }
  return null;
}

function cleanName(value: string) {
  return value.replace(/\b(for|using|with|and|include|including|tomorrow|today|morning|afternoon|in|on|at|the|job|work)\b.*$/i, "").replace(/\b(tomorrow|today|morning|afternoon)\b/g, "").trim();
}

export function parseRequest(raw: string, context: AssistantContext = {}, records: CompanyRecords = {}) {
  const text = raw.trim();
  const normalized = normalize(text);
  const intent = detectIntent(text, context);
  const draft = { ...(context.draft || {}), intent } as Draft;
  const hours = extractHours(normalized);
  const knownCustomer = (records.customers || []).find((name) => normalized.includes(normalize(name)) || normalized.includes(normalize(name).split(" ")[0]));
  const customerGuess = knownCustomer || extractCandidate(text, [
    /for ([a-z][\w' -]{1,40})/,
    /book ([a-z][\w' -]{1,30})/,
    /put ([a-z][\w']+) down/,
    /([a-z][\w' -]{1,30})'s job/,
    /customer ([a-z][\w' -]{1,40})/,
    /client ([a-z][\w' -]{1,40})/,
  ]) || (context.awaiting === "customerName" ? text.trim() : null);
  const equipmentGuess = extractCandidate(text, [
    /with (?:the )?([a-z0-9][\w' -]{1,40})/,
    /using (?:the )?([a-z0-9][\w' -]{1,40})/,
    /(?:the )?([a-z0-9][\w' -]{1,30})(?: machine| excavator| loader)?$/,
    /equipment ([a-z0-9][\w' -]{1,40})/,
  ]) || (context.awaiting === "equipmentName" ? text.trim() : null);
  const attachmentGuess = extractCandidate(normalized, [/include (?:\d+(?:\.\d+)?\s*hours? of )?([a-z][\w -]{2,30})/, /attachment ([a-z][\w -]{2,30})/, /add the ([a-z][\w -]{2,30})/]);
  const jobGuess = extractCandidate(text, [/(?:finish|complete|invoice) (?:the )?([a-z][\w' -]{1,40})/, /([a-z][\w' -]{1,40}) job/]) || customerGuess;

  if (/actually make it|change that to|make it/.test(normalized)) {
    const date = extractDate(normalized);
    if (date) draft.startDate = date;
    if (hours[0]) draft.equipmentHours = hours[0];
    if (equipmentGuess) draft.equipmentName = bestMatch(equipmentGuess, records.equipment) || equipmentGuess;
  }

  draft.customerName = bestMatch(customerGuess, records.customers) || customerGuess || draft.customerName || context.lastCustomer;
  draft.equipmentName = bestMatch(equipmentGuess, records.equipment) || bestMatch(NICKNAMES[normalize(equipmentGuess || "")] || equipmentGuess, records.equipment) || equipmentGuess || draft.equipmentName || context.lastEquipment;
  draft.attachmentName = bestMatch(attachmentGuess, records.attachments) || attachmentGuess || draft.attachmentName;
  draft.equipmentHours = hours[0] ?? draft.equipmentHours ?? null;
  draft.attachmentHours = hours[1] ?? draft.attachmentHours ?? null;
  draft.jobQuery = jobGuess || draft.jobQuery || context.lastJob;
  draft.startDate = extractDate(normalized) || draft.startDate || null;
  draft.startTime = extractTime(normalized) || (context.awaiting === "startTime" ? extractTime(text) || (/^\d{1,2}$/.test(normalized) ? extractTime(`${normalized} am`) : null) : draft.startTime) || null;
  draft.rate = extractMoney(text) ?? draft.rate ?? null;
  draft.title = draft.customerName ? `${draft.customerName} job` : draft.title;
  draft.name = draft.customerName || draft.equipmentName;
  if (context.awaiting === "customerName" && !customerGuess) draft.customerName = text.trim();
  if (context.awaiting === "equipmentName" && !draft.equipmentName) draft.equipmentName = text.trim();
  return draft;
}

export function missingFor(draft: Draft, records: CompanyRecords = {}) {
  if (draft.intent === "create_customer" && !draft.customerName) return "customerName";
  if (draft.intent === "create_job" && !draft.customerName) return "customerName";
  if (draft.intent === "create_job" && !draft.equipmentName && (records.equipment || []).length !== 1) return "equipmentName";
  if (draft.intent === "create_job" && !draft.startTime && !draft.startDate) return "startTime";
  if (draft.intent === "create_quote" && !draft.customerName) return "customerName";
  if (draft.intent === "create_quote" && !draft.equipmentName) return "equipmentName";
  if (draft.intent === "create_quote" && !draft.equipmentHours) return "equipmentHours";
  if (draft.intent === "complete_job" && !draft.jobQuery && !draft.customerName) return "jobQuery";
  if (draft.intent === "complete_job" && !draft.equipmentHours) return "equipmentHours";
  if (draft.intent === "schedule_maintenance" && !draft.equipmentName) return "equipmentName";
  if (draft.intent === "schedule_maintenance" && !draft.startDate) return "date";
  if (draft.intent === "add_equipment" && !draft.name) return "equipmentName";
  if (draft.intent === "reschedule_job" && !draft.startDate) return "date";
  return null;
}

export function questionFor(field: string) {
  const questions: Record<string, string> = {
    customerName: "Which customer is this for?",
    equipmentName: "Which machine will you be using?",
    equipmentHours: "How many hours did you work?",
    startTime: "What time are you starting?",
    date: "What date should I use?",
    jobQuery: "Which job should I use?",
  };
  return questions[field] || "Can you clarify that?";
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 86400000);
}
