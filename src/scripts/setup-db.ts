import { PrismaClient, UserRole } from "@prisma/client";
import { hashPassword } from "@/lib/utils";

const prisma = new PrismaClient();

async function main() {
  // Create super admin user
  const hashedPassword = await hashPassword("password123");
  const superAdmin = await prisma.user.create({
    data: {
      email: "super@admin.com",
      password: hashedPassword,
      name: "Super Admin",
      role: UserRole.SUPER_ADMIN,
    },
  });

  console.log("Created super admin user:", superAdmin);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 