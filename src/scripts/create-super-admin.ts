import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function createSuperAdmin() {
  try {
    const email = "super@demo.com";
    const password = "super";

    // Check if super admin already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log("Super admin already exists");
      return;
    }

    // Create super admin
    const hashedPassword = await hashPassword(password);
    const superAdmin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: "SUPER_ADMIN",
        name: "Super Admin",
      },
    });

    console.log("Super admin created successfully:", superAdmin);
  } catch (error) {
    console.error("Error creating super admin:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin(); 