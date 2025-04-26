import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Get the parent record for the current user
    const parent = await prisma.parent.findFirst({
      where: { userId: session.user.id },
    });

    // Get the child with their enrollments to verify ownership
    const child = await prisma.child.findUnique({
      where: { id: params.id },
      include: {
        parent: true,
        enrollments: {
          include: {
            progress: true
          }
        }
      }
    });

    if (!child) {
      return NextResponse.json(
        { error: "Child not found" },
        { status: 404 }
      );
    }

    // Check if the user is the parent of this child
    if (!parent || child.parentId !== parent.id) {
      return NextResponse.json(
        { error: "You can only delete your own children" },
        { status: 403 }
      );
    }

    // Delete the child and all related records in a transaction
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // First delete all skill progress records for all enrollments
      if (child.enrollments.length > 0) {
        await tx.skillProgress.deleteMany({
          where: {
            enrollmentId: {
              in: child.enrollments.map(e => e.id)
            }
          }
        });
      }

      // Delete all enrollments
      await tx.enrollment.deleteMany({
        where: {
          childId: child.id
        }
      });

      // Finally delete the child
      await tx.child.delete({
        where: {
          id: child.id
        }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting child:", error);
    return NextResponse.json(
      { error: "Failed to delete child" },
      { status: 500 }
    );
  }
} 