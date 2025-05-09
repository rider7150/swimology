import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function resetDatabase() {
  try {
    console.log("Starting database reset...");
    
    // Delete all existing users
    console.log("Deleting all existing users...");
    await prisma.user.deleteMany();
    console.log("All users deleted.");

    // Create new super admin
    const email = "super@admin.com";
    const password = "super";

    console.log("Creating new super admin...");
    const hashedPassword = await bcrypt.hash(password, 10);
    const superAdmin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: "SUPER_ADMIN",
        name: "Super Admin",
      },
    });
    console.log("Super admin created:", superAdmin);

    // Verify the database state
    const allUsers = await prisma.user.findMany();
    console.log("\nAll users in database:", allUsers);

  } catch (error) {
    console.error("Error during database reset:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
      console.error("Error stack:", error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the reset
resetDatabase(); 