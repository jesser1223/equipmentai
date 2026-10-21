import { invoiceTotals, outstandingBalance } from "../lib/invoice-calc";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const equipmentOnly = invoiceTotals(8 * 150, 0.05);
assert(equipmentOnly.subtotal === 1200, "equipment subtotal");
assert(equipmentOnly.taxAmount === 60, "equipment GST");
assert(equipmentOnly.total === 1260, "equipment total");

const withAttachment = invoiceTotals(8 * 150 + 4 * 40, 0.05);
assert(withAttachment.subtotal === 1360, "attachment subtotal");
assert(withAttachment.total === 1428, "attachment total");

const fuelOnly = invoiceTotals(75, 0.05);
assert(fuelOnly.subtotal === 75, "fuel subtotal");
assert(fuelOnly.taxAmount === 3.75, "fuel GST");

const rounded = invoiceTotals(10.005, 0.05);
assert(rounded.subtotal === 10.01 || rounded.subtotal === 10, "rounding stable");

const outstanding = outstandingBalance([
  { status: "Issued", total: 100, amountPaid: 40 },
  { status: "Partially Paid", total: 200, amountPaid: 50 },
  { status: "Paid", total: 500, amountPaid: 500 },
  { status: "Void", total: 300, amountPaid: 0 },
]);
assert(outstanding === 210, `outstanding was ${outstanding}`);

const negativeGuard = outstandingBalance([
  { status: "Issued", total: 50, amountPaid: 60 },
]);
assert(negativeGuard === 0, "no negative outstanding");

console.log("invoice-calc tests passed");
