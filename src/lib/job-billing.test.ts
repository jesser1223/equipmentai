import { describe, it, expect } from "vitest";
import { calculateJobCharges } from "./job-billing";

describe("job billing matches invoice", () => {
  it("hourly equipment + attachments + fuel + GST", () => {
    const result = calculateJobCharges({
      equipmentName: "Excavator",
      equipmentUnit: "EX-01",
      equipmentRate: 150,
      actualHours: 6,
      attachments: [
        { id: "1", name: "Breaker", rate: 40, hours: 3 },
        { id: "2", name: "Bucket", rate: 20, hours: 2 },
      ],
      fuelCost: 50,
      taxRate: 0.05,
    });
    // 6*150=900, 3*40=120, 2*20=40, fuel=50 → subtotal 1110, tax 55.50, total 1165.50
    expect(result.subtotal).toBe(1110);
    expect(result.taxAmount).toBe(55.5);
    expect(result.total).toBe(1165.5);
    expect(result.lines).toHaveLength(4);
  });

  it("missing rate is flagged and not silently zeroed into a wrong total", () => {
    const result = calculateJobCharges({
      equipmentName: "Loader",
      equipmentRate: 0,
      actualHours: 4,
      taxRate: 0.05,
    });
    expect(result.missing).toContain("equipment rate");
    expect(result.lines).toHaveLength(0);
  });

  it("no attachments and zero tax", () => {
    const result = calculateJobCharges({
      equipmentName: "Skid",
      equipmentRate: 100,
      actualHours: 2.5,
      taxRate: 0,
    });
    expect(result.subtotal).toBe(250);
    expect(result.taxAmount).toBe(0);
    expect(result.total).toBe(250);
  });
});
