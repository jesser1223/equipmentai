export const sampleMetrics = {
  todaysJobs: 7,
  equipmentAvailable: 12,
  maintenanceAlerts: 3,
  unpaidInvoices: 4,
};

export const sampleEquipment = [
  { id: "AT-7892", name: "Fleet Truck", type: "Truck", status: "Checked Out", lastUser: "Liam O.", location: "Los Angeles", time: "09:15 AM" },
  { id: "CAT-450", name: "Excavator", type: "Machine", status: "Checked In", lastUser: "Ava L.", location: "Seattle", time: "11:30 AM" },
  { id: "DIG-301", name: "Digger", type: "Machine", status: "Maintenance", lastUser: "Service", location: "Denver", time: "08:45 AM" },
  { id: "SNS-112", name: "Sensor Kit", type: "Tool", status: "Checked Out", lastUser: "Ben C.", location: "Portland", time: "10:05 AM" },
];

export const sampleJobs = [
  { time: "9:00–11:00", client: "John D.", job: "AC Repair", tech: "Dave S.", color: "bg-blue-500" },
  { time: "10:00–11:30", client: "Mike K.", job: "Inspection", tech: "Tom H.", color: "bg-amber-500" },
  { time: "1:00–2:30", client: "Sarah L.", job: "Deep Clean", tech: "Maria R.", color: "bg-emerald-500" },
  { time: "2:00–4:00", client: "Emma W.", job: "Plumbing", tech: "Dave S.", color: "bg-blue-500" },
];

export const sampleLocations = [
  { lat: 34.05, lng: -118.25, label: "Job — LA Fleet Truck" },
  { lat: 47.60, lng: -122.33, label: "Job — Seattle Excavator" },
  { lat: 39.74, lng: -104.99, label: "Maintenance — Denver" },
];
