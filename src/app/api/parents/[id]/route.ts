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

    // Check if user is admin (you may need to adjust this based on your auth model)
    if (session.user.role !== "ADMIN" && session.user.role !== "INSTRUCTOR" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized: Only admins can delete parents" },
        { status: 403 }
      );
    }

    const { id } = params;
    
    // Find the parent to make sure it exists
    const parent = await prisma.parent.findUnique({
      where: { id },
      include: { 
        user: true,
        children: {
          include: {
            enrollments: {
              include: {
                progress: true
              }
            }
          }
        }
      }
    });

    if (!parent) {
      return NextResponse.json(
        { error: "Parent not found" },
        { status: 404 }
      );
    }

    // Delete everything in a transaction
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Delete all skill progress for all enrollments of all children
      for (const child of parent.children) {
        for (const enrollment of child.enrollments) {
          await tx.skillProgress.deleteMany({
            where: { enrollmentId: enrollment.id }
          });
        }
        
        // Delete all enrollments for this child
        await tx.enrollment.deleteMany({
          where: { childId: child.id }
        });
      }
      
      // Delete all children
      await tx.child.deleteMany({
        where: { parentId: parent.id }
      });
      
      // Delete the parent record
      await tx.parent.delete({
        where: { id }
      });
      
      // Delete the associated user if it exists
      if (parent.userId) {
        await tx.user.delete({
          where: { id: parent.userId }
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting parent:", error);
    return NextResponse.json(
      { error: "Failed to delete parent" },
      { status: 500 }
    );
  }
} 