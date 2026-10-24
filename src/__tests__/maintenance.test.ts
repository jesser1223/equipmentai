import { calculateTotalCost, computeServiceStatus, validateHourMeterUpdate } from "../lib/maintenance";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

assert(calculateTotalCost(100, 50.5, 10) === 160.5, "total cost");
assert(calculateTotalCost(0, 0, 0) === 0, "zero total");

assert(validateHourMeterUpdate(1000, 999).ok === false, "reject lower meter");
assert(validateHourMeterUpdate(1000, 1500).ok === true, "accept higher meter");
assert(validateHourMeterUpdate(null, 500).ok === true, "accept first meter");
assert(validateHourMeterUpdate(100, -1).ok === false, "reject negative");

assert(computeServiceStatus({}) === "Not configured", "not configured empty");
assert(computeServiceStatus({ hourMeter: 100 }) === "Not configured", "not configured hours only");

assert(
  computeServiceStatus({
    hourMeter: 1200,
    maintenanceRecords: [{ serviceDate: new Date(), nextServiceHours: 1100 }],
  }) === "Overdue",
  "hour overdue"
);

assert(
  computeServiceStatus({
    hourMeter: 1060,
    maintenanceRecords: [{ serviceDate: new Date(), nextServiceHours: 1100 }],
  }) === "Due soon",
  "hour due soon"
);

assert(
  computeServiceStatus({
    hourMeter: 900,
    maintenanceRecords: [{ serviceDate: new Date(), nextServiceHours: 1100 }],
  }) === "Current",
  "hour current"
);

const past = new Date();
past.setDate(past.getDate() - 5);
assert(
  computeServiceStatus({
    maintenanceRecords: [{ serviceDate: new Date(), nextServiceDate: past }],
  }) === "Overdue",
  "date overdue"
);

const soon = new Date();
soon.setDate(soon.getDate() + 7);
assert(
  computeServiceStatus({
    maintenanceRecords: [{ serviceDate: new Date(), nextServiceDate: soon }],
  }) === "Due soon",
  "date due soon"
);

console.log("maintenance tests passed");
