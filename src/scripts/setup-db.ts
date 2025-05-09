import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function setupDatabase() {
  try {
    console.log("Starting database setup...");
    
    // Test connection
    await prisma.$connect();
    console.log("Database connection successful!");

    // Create super admin
    const email = "super@demo.com";
    const password = "sts131";

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log("Super admin already exists:", existingUser);
    } else {
      // Create new super admin
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
    }

    // List all users to verify
    const allUsers = await prisma.user.findMany();
    console.log("\nAll users in database:", allUsers);

  } catch (error) {
    console.error("Error during database setup:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
      console.error("Error stack:", error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
setupDatabase(); 