import { Prisma } from "@prisma/client";

export type ServiceStatus = "Overdue" | "Due soon" | "Current" | "Not configured";

const DUE_SOON_HOURS = 50;
const DUE_SOON_DAYS = 14;

export function calculateTotalCost(parts: number, labour: number, other: number): number {
  const p = Number(parts) || 0;
  const l = Number(labour) || 0;
  const o = Number(other) || 0;
  return Math.round((p + l + o) * 100) / 100;
}

export function computeServiceStatus(equipment: {
  hourMeter?: number | null;
  maintenanceIntervalHours?: number | null;
  nextMaintenanceDue?: Date | null;
  maintenanceRecords?: Array<{
    hourMeterAtService?: number | null;
    nextServiceHours?: number | null;
    nextServiceDate?: Date | null;
    serviceDate: Date;
  }>;
}): ServiceStatus {
  const records = equipment.maintenanceRecords || [];
  const latest = records
    .slice()
    .sort((a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime())[0];

  const nextHours =
    latest?.nextServiceHours ??
    (equipment.maintenanceIntervalHours && equipment.hourMeter
      ? equipment.hourMeter + equipment.maintenanceIntervalHours
      : null);

  const nextDate = latest?.nextServiceDate ?? equipment.nextMaintenanceDue ?? null;
  const currentHours = equipment.hourMeter ?? null;

  const hasHourThreshold = nextHours != null && currentHours != null;
  const hasDateThreshold = nextDate != null;

  if (!hasHourThreshold && !hasDateThreshold) return "Not configured";

  const now = new Date();
  let overdue = false;
  let dueSoon = false;

  if (hasHourThreshold) {
    if (currentHours! >= nextHours!) overdue = true;
    else if (currentHours! >= nextHours! - DUE_SOON_HOURS) dueSoon = true;
  }

  if (hasDateThreshold) {
    const due = new Date(nextDate!);
    if (due < now) overdue = true;
    else {
      const soon = new Date(due);
      soon.setDate(soon.getDate() - DUE_SOON_DAYS);
      if (now >= soon) dueSoon = true;
    }
  }

  if (overdue) return "Overdue";
  if (dueSoon) return "Due soon";
  return "Current";
}

export function validateHourMeterUpdate(
  current: number | null | undefined,
  proposed: number | null | undefined
): { ok: true } | { ok: false; error: string } {
  if (proposed == null || Number.isNaN(proposed)) return { ok: true };
  if (proposed < 0) return { ok: false, error: "Hour meter cannot be negative." };
  if (current != null && proposed < current) {
    return { ok: false, error: `Hour meter (${proposed}) cannot be lower than the current reading (${current}).` };
  }
  return { ok: true };
}
