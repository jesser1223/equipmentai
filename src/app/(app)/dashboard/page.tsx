import { MetricCards } from "@/components/metric-cards";
import { MapPreview } from "@/components/map-preview";
import { EquipmentTable } from "@/components/equipment-table";
import { SchedulePreview } from "@/components/schedule-preview";
import { DashboardExtras } from "@/components/dashboard-extras";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <MetricCards />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-4">
          <DashboardExtras />
          <SchedulePreview />
        </div>
        <div className="xl:col-span-8">
          <MapPreview />
        </div>
      </div>
      <EquipmentTable />
    </div>
  );
}
