import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function DELETE(
  req: Request,
  { params }: { params: { organizationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // First, delete all related records
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Get all enrollments for this organization's lessons
      const enrollments = await tx.enrollment.findMany({
        where: {
          lesson: {
            classLevel: {
              organizationId: params.organizationId
            }
          }
        }
      });

      // Delete all skill progress records for these enrollments
      if (enrollments.length > 0) {
        await tx.skillProgress.deleteMany({
          where: {
            enrollmentId: {
              in: enrollments.map((e: { id: string }) => e.id)
            }
          }
        });
      }

      // Delete all enrollments
      await tx.enrollment.deleteMany({
        where: {
          lesson: {
            classLevel: {
              organizationId: params.organizationId
            }
          }
        }
      });

      // Delete all lessons
      await tx.lesson.deleteMany({
        where: {
          classLevel: {
            organizationId: params.organizationId
          }
        }
      });

      // Delete all skills
      await tx.skill.deleteMany({
        where: {
          classLevel: {
            organizationId: params.organizationId
          }
        }
      });

      // Delete all class levels
      await tx.classLevel.deleteMany({
        where: {
          organizationId: params.organizationId
        }
      });

      // Get all users associated with this organization
      const users = await tx.user.findMany({
        where: {
          OR: [
            { admin: { organizationId: params.organizationId } },
            { instructor: { organizationId: params.organizationId } },
            { parent: { organizationId: params.organizationId } },
          ]
        }
      });

      // Delete all admins, instructors, and parents
      await tx.admin.deleteMany({
        where: { organizationId: params.organizationId }
      });
      await tx.instructor.deleteMany({
        where: { organizationId: params.organizationId }
      });
      await tx.parent.deleteMany({
        where: { organizationId: params.organizationId }
      });

      // Delete all users
      if (users.length > 0) {
        await tx.user.deleteMany({
          where: {
            id: {
              in: users.map((u: { id: string }) => u.id)
            }
          }
        });
      }

      // Finally, delete the organization
      await tx.organization.delete({
        where: { id: params.organizationId }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting organization:", error);
    return NextResponse.json(
      { error: "Failed to delete organization" },
      { status: 500 }
    );
  }
} 