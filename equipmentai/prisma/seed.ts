import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create admin organization + user if they don't exist
  let org = await prisma.organization.findFirst({ where: { name: "EquipmentAI Admin" } });
  if (!org) {
    org = await prisma.organization.create({
      data: { name: "EquipmentAI Admin", status: "Approved" },
    });
  } else if (org.status !== "Approved") {
    org = await prisma.organization.update({
      where: { id: org.id },
      data: { status: "Approved" },
    });
  }

  const adminEmail = "admin@equipmentai.com";
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash("admin123", 10);
    await prisma.user.create({
      data: {
        name: "Admin",
        email: adminEmail,
        passwordHash,
        organizationId: org.id,
      },
    });
    console.log("Admin account created:");
    console.log("  Email:    admin@equipmentai.com");
    console.log("  Password: admin123");
  } else {
    console.log("Admin account already exists.");
  }

  // Seed sample data under this org if none exists
  const equipmentCount = await prisma.equipment.count({ where: { organizationId: org.id } });
  if (equipmentCount === 0) {
    await prisma.customer.createMany({
      data: [
        { name: "John D.", email: "john@example.com", company: "Acme Corp", address: "Los Angeles, CA", organizationId: org.id },
        { name: "Sarah L.", email: "sarah@example.com", company: "Green Clean", address: "Seattle, WA", organizationId: org.id },
        { name: "Mike K.", company: "Inspect Pro", address: "Denver, CO", organizationId: org.id },
      ],
    });

    await prisma.equipment.createMany({
      data: [
        {
          name: "Fleet Truck",
          category: "Truck",
          unitNumber: "AT-7892",
          status: "In Use",
          location: "Los Angeles",
          latitude: 34.0522,
          longitude: -118.2437,
          hourlyRate: 85,
          dailyRate: 450,
          organizationId: org.id,
        },
        {
          name: "Excavator",
          category: "Machine",
          unitNumber: "CAT-450",
          status: "Available",
          location: "Seattle",
          latitude: 47.6062,
          longitude: -122.3321,
          hourlyRate: 120,
          dailyRate: 650,
          organizationId: org.id,
        },
        {
          name: "Digger",
          category: "Machine",
          unitNumber: "DIG-301",
          status: "Maintenance",
          location: "Denver",
          latitude: 39.7392,
          longitude: -104.9903,
          hourlyRate: 95,
          dailyRate: 500,
          organizationId: org.id,
        },
      ],
    });
    console.log("Sample equipment and customers seeded.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
