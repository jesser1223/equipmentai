import { customerDeleteDecision, selectableCustomers } from "../lib/customers";
import { canTransitionQuote, normalizeTaxRate, quoteTaxAmount, validateQuoteConversion } from "../lib/quotes";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const blocked = customerDeleteDecision({ quotes: 1, jobs: 0, invoices: 0 });
assert(blocked.allowed === false, "customer with quotes cannot be deleted");
assert(blocked.message.includes("Archive"), "blocked delete explains archive");
assert(customerDeleteDecision({ quotes: 0, jobs: 0, invoices: 0 }).allowed === true, "empty customer can be deleted");

const active = selectableCustomers([{ id: "a", archivedAt: null }, { id: "b", archivedAt: "2026-01-01" }]);
assert(active.length === 1 && active[0].id === "a", "archived customers excluded from new work");

assert(canTransitionQuote("Draft", "Sent"), "draft to sent");
assert(canTransitionQuote("Sent", "Accepted"), "sent to accepted");
assert(canTransitionQuote("Accepted", "Draft") === false, "accepted cannot revert");
assert(canTransitionQuote("Accepted", "Declined", true) === false, "converted quote cannot change");

assert(normalizeTaxRate(0.05) === 0.05, "decimal tax stays decimal");
assert(normalizeTaxRate(5) === 0.05, "percent tax converts to decimal");
assert(quoteTaxAmount(100, 0.05) === 5, "5% of 100 is 5");
assert(quoteTaxAmount(100, 5) === 5, "legacy 5 means 5%");

const missingDate = validateQuoteConversion({ status: "Accepted", location: "123 Main" }, {});
assert(missingDate === "Start date is required.", "conversion requires start date");
const notAccepted = validateQuoteConversion({ status: "Draft", location: "123 Main" }, { startDate: "2026-10-22" });
assert(notAccepted === "Only accepted quotes can be converted to a job.", "only accepted quotes convert");
const ok = validateQuoteConversion(
  { status: "Accepted", location: "123 Main", lines: [{ equipmentId: "eq1" }] },
  { startDate: "2026-10-22" }
);
assert(typeof ok !== "string" && ok.equipmentId === "eq1", "conversion uses quote equipment");
const duplicate = validateQuoteConversion({ status: "Accepted", location: "123 Main", job: { id: "j1" } }, { startDate: "2026-10-22" });
assert(duplicate === "This quote has already been converted to a job.", "duplicate conversion blocked");

console.log("customer and quote workflow tests passed");
