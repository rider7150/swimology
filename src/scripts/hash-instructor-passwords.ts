import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/utils";
import { UserRole } from "@prisma/client";

async function hashInstructorPasswords() {
  try {
    // Get all instructor users
    const instructorUsers = await prisma.user.findMany({
      where: {
        role: UserRole.INSTRUCTOR,
      },
    });

    console.log(`Found ${instructorUsers.length} instructors`);

    // Update each instructor's password if it's not already hashed
    // We'll assume a password is not hashed if it's shorter than 50 characters
    // (bcrypt hashes are typically 60 characters long)
    for (const user of instructorUsers) {
      if (user.password.length < 50) {
        console.log(`Hashing password for instructor: ${user.email}`);
        const hashedPassword = await hashPassword(user.password);
        await prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword },
        });
        console.log(`Updated password for instructor: ${user.email}`);
      } else {
        console.log(`Password already hashed for instructor: ${user.email}`);
      }
    }

    console.log('Finished processing instructor passwords');
  } catch (error) {
    console.error('Error updating instructor passwords:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
hashInstructorPasswords(); 