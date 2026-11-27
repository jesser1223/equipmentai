import { detectIntent, normalize, parseRequest, bestMatch, missingFor } from "./assistant";

const records = { customers: ["Bob Anderson", "Smith Construction"], equipment: ["CAT 320", "Skid Steer"], attachments: ["Hydraulic breaker"] };
const cases: [string, string][] = [
  ["Make a job for Bob tomorrow", "create_job"],
  ["Book Bob in for tomorrow morning", "create_job"],
  ["Schedule some work for Bob tomorrow", "create_job"],
  ["Put Bob down for tomorrow with the skid steer", "create_job"],
  ["I need to get Bob booked in tomorrow", "create_job"],
  ["schedual bob tomorow", "create_job"],
  ["book bob tmrw", "create_job"],
  ["Create a quote for Smith for 8 hours of excavator work", "create_quote"],
  ["Need an estimate for Smith", "create_quote"],
  ["Finish Bob's job, we worked 8 hours", "complete_job"],
  ["We worked eight hours with the excavator", "complete_job"],
  ["Make the invoice", "create_invoice"],
  ["Show outstanding invoices", "outstanding"],
  ["Who hasn't paid?", "outstanding"],
  ["What's on today?", "briefing"],
  ["Is the CAT available?", "availability"],
  ["Which equipment needs service?", "maintenance"],
  ["Add customer Northline", "create_customer"],
  ["What's the CAT rate?", "rates"],
  ["Move Bob's job to Friday", "reschedule_job"],
  ["Actually make it Friday", "reschedule_job"],
  ["Convert the Smith quote into a job", "convert_quote"],
];

const variants = ["please ", "can you ", "hey ", ""];
let failed = 0;
let total = 0;
for (const prefix of variants) {
  for (const [text, expected] of cases) {
    total += 1;
    const intent = detectIntent(prefix + text);
    if (intent !== expected) {
      failed += 1;
      console.error("FAIL", prefix + text, "got", intent, "expected", expected);
    }
  }
}
for (let i = 0; i < 120; i++) {
  total += 1;
  const text = ["book bob tomorrow", "schedule work for bob tomorrow", "put bob down tomorrow", "make a job for bob tomorrow"][i % 4];
  if (detectIntent(text) !== "create_job") {
    failed += 1;
    console.error("FAIL generated", text);
  }
}
const parsed = parseRequest("Put Bob down for tomorrow with the skid steer", {}, records);
if (parsed.intent !== "create_job" || !parsed.customerName?.toLowerCase().includes("bob") || !parsed.equipmentName?.toLowerCase().includes("skid")) {
  failed += 1;
  console.error("FAIL entity", parsed);
}
const follow = parseRequest("the CAT", { awaiting: "equipmentName", draft: { intent: "create_job", customerName: "Bob Anderson" } }, records);
if (follow.intent !== "create_job" || !follow.equipmentName?.toLowerCase().includes("cat")) {
  failed += 1;
  console.error("FAIL follow-up", follow);
}
if (normalize("tomorow") !== "tomorrow") {
  failed += 1;
  console.error("FAIL normalize");
}
if (bestMatch("skid", records.equipment) !== "Skid Steer") {
  failed += 1;
  console.error("FAIL fuzzy");
}
const missing = missingFor({ intent: "create_job", customerName: "Bob" }, records);
if (missing !== "equipmentName") {
  failed += 1;
  console.error("FAIL missing", missing);
}
const accuracy = ((total - failed) / total) * 100;
console.log(`cases=${total} failed=${failed} accuracy=${accuracy.toFixed(1)}%`);
if (failed || accuracy < 95) process.exit(1);
console.log("assistant intelligence checks passed");
