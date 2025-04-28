import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/utils";
import { Prisma } from '@prisma/client';

export async function DELETE(
  request: Request,
  { params }: { params: { organizationId: string; instructorId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: "Only administrators can delete instructors" },
        { status: 403 }
      );
    }

    // Delete instructor and associated user in a transaction
    await prisma.$transaction(async (tx) => {
      const instructor = await tx.instructor.findUnique({
        where: {
          id: params.instructorId,
          organizationId: params.organizationId,
        },
        select: {
          userId: true,
        },
      });

      if (!instructor) {
        throw new Error("Instructor not found");
      }

      // Delete the instructor first (due to foreign key constraints)
      await tx.instructor.delete({
        where: {
          id: params.instructorId,
        },
      });

      // Then delete the user
      await tx.user.delete({
        where: {
          id: instructor.userId,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting instructor:", error);
    return NextResponse.json(
      { error: "Failed to delete instructor" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { organizationId: string; instructorId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: "Only administrators can update instructors" },
        { status: 403 }
      );
    }

    const data = await request.json();
    const { name, email, password, phoneNumber } = data;

    // Update instructor and associated user in a transaction
    await prisma.$transaction(async (tx) => {
      const instructor = await tx.instructor.findUnique({
        where: {
          id: params.instructorId,
          organizationId: params.organizationId,
        },
        select: {
          userId: true,
        },
      });

      if (!instructor) {
        throw new Error("Instructor not found");
      }

      // Update the user
      const userUpdateData: Prisma.UserUpdateInput = {
        name,
        email,
      };

      // Only include password in update if it was provided
      if (password) {
        userUpdateData.password = await hashPassword(password);
      }

      await tx.user.update({
        where: {
          id: instructor.userId,
        },
        data: userUpdateData,
      });

      // Update the instructor
      await tx.instructor.update({
        where: {
          id: params.instructorId,
        },
        data: {
          phoneNumber,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating instructor:", error);
    return NextResponse.json(
      { error: "Failed to update instructor" },
      { status: 500 }
    );
  }
} 