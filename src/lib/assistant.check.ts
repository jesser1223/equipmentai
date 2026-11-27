import { detectIntent, parseRequest, wordsToNumber } from "./assistant";

const checks = [
  ["What jobs are on today?", "briefing"],
  ["Show outstanding invoices", "outstanding"],
  ["Which equipment needs service?", "maintenance"],
  ["Create a quote for Smith Construction for eight hours of excavator work", "create_quote"],
  ["Finish the Anderson job. We worked nine hours", "complete_job"],
  ["Add customer Northline", "create_customer"],
  ["Is the excavator available?", "availability"],
];

let failed = 0;
for (const [text, expected] of checks) {
  const intent = detectIntent(text);
  if (intent !== expected) {
    failed += 1;
    console.error("FAIL", text, "got", intent, "expected", expected);
  }
}
const quote = parseRequest("Create a quote for Smith Construction for eight hours of excavator work and include four hours of hydraulic breaker usage");
if (quote.equipmentHours !== 8 || quote.attachmentHours !== 4 || quote.customerName !== "Smith Construction") {
  failed += 1;
  console.error("FAIL quote parse", quote);
}
if (wordsToNumber("eight hours") !== "8 hours") {
  failed += 1;
  console.error("FAIL number words");
}
if (failed) {
  console.error(`${failed} assistant checks failed`);
  process.exit(1);
}
console.log("assistant checks passed");
