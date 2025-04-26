import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function fixPasswords() {
  try {
    // Get all users with role INSTRUCTOR
    const instructors = await prisma.user.findMany({
      where: {
        role: "INSTRUCTOR"
      }
    });

    console.log(`Found ${instructors.length} instructors`);

    // Update each instructor's password
    for (const instructor of instructors) {
      // Clean and hash the password
      const cleanPassword = instructor.password.replace(/"/g, '').trim();
      const hashedPassword = await hash(cleanPassword, 12);

      // Update the password
      await prisma.user.update({
        where: { id: instructor.id },
        data: { password: hashedPassword }
      });

      console.log(`Updated password for instructor: ${instructor.email}`);
    }

    console.log('Password update completed successfully');
  } catch (error) {
    console.error('Error updating passwords:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixPasswords(); 