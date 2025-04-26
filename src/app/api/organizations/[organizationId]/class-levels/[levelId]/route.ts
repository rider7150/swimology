import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as z from "zod";

const classLevelSchema = z.object({
  name: z.string().min(1, "Level name is required"),
  description: z.string().optional(),
  sortOrder: z.number().min(0, "Order must be a positive number"),
  capacity: z.number().min(1, "Capacity must be at least 1"),
  color: z.string().min(1, "Color is required"),
});

async function checkPermissions(userId: string, organizationId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return false;
  }

  if (user.role === "SUPER_ADMIN") {
    return true;
  }

  const admin = await prisma.admin.findFirst({
    where: {
      userId: user.id,
      organizationId,
    },
  });

  return !!admin;
}

export async function PUT(
  req: Request,
  context: { params: { organizationId: string; levelId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await Promise.resolve(context.params);
    const { organizationId, levelId } = params;

    const hasPermission = await checkPermissions(session.user.id, organizationId);
    if (!hasPermission) {
      return NextResponse.json(
        { error: "Only administrators can manage class levels" },
        { status: 403 }
      );
    }

    const json = await req.json();
    const body = classLevelSchema.parse(json);

    // First fetch the existing class level
    const existingLevel = await prisma.classLevel.findUnique({
      where: {
        id: levelId,
      },
    });

    if (!existingLevel) {
      return NextResponse.json(
        { error: "Class level not found" },
        { status: 404 }
      );
    }

    // Update only the basic fields first
    const updatedLevel = await prisma.classLevel.update({
      where: {
        id: levelId,
      },
      data: {
        name: body.name,
        description: body.description ?? existingLevel.description,
        sortOrder: body.sortOrder,
        capacity: body.capacity,
        color: body.color,
      },
    });

    return NextResponse.json(updatedLevel);
  } catch (error) {
    console.error("Error details:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  context: { params: { organizationId: string; levelId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await Promise.resolve(context.params);
    const { organizationId, levelId } = params;

    const hasPermission = await checkPermissions(session.user.id, organizationId);
    if (!hasPermission) {
      return NextResponse.json(
        { error: "Only administrators can manage class levels" },
        { status: 403 }
      );
    }

    // Check if there are any lessons using this class level
    const existingLessons = await prisma.lesson.findFirst({
      where: {
        classLevelId: levelId,
      },
    });

    if (existingLessons) {
      return NextResponse.json(
        { error: "Cannot delete a class level that has lessons" },
        { status: 400 }
      );
    }

    await prisma.classLevel.delete({
      where: {
        id: levelId,
        organizationId: organizationId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting class level:", error);
    const message = error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
} 