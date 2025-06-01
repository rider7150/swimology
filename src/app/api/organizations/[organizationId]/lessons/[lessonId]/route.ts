import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const lessonSchema = z.object({
  classLevelId: z.string(),
  instructorId: z.string(),
  month: z.number(),
  year: z.number(),
  dayOfWeek: z.number(),
  startTime: z.string(),
  endTime: z.string()
});

export async function DELETE(
  request: Request,
  { params }: { params: { organizationId: string; lessonId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user;
    const { organizationId, lessonId } = params;

    if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Check if lesson exists and belongs to the organization
    const lesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        classLevel: {
          organizationId,
        },
      },
    });

    if (!lesson) {
      return NextResponse.json(
        { error: "Lesson not found" },
        { status: 404 }
      );
    }

    // Delete the lesson
    await prisma.lesson.delete({
      where: {
        id: lessonId,
      },
    });

    return NextResponse.json({ message: "Lesson deleted successfully" });
  } catch (error) {
    console.error("Error deleting lesson:", error);
    return NextResponse.json(
      { error: "Failed to delete lesson" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { organizationId: string; lessonId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user;
    const { organizationId, lessonId } = params;

    if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = lessonSchema.parse(body);

    // Check if instructor belongs to organization
    const instructor = await prisma.instructor.findUnique({
      where: {
        id: validatedData.instructorId,
        organizationId,
      },
    });

    if (!instructor) {
      return NextResponse.json(
        { error: "Instructor not found in organization" },
        { status: 404 }
      );
    }

    // Check if class level belongs to organization
    const classLevel = await prisma.classLevel.findUnique({
      where: {
        id: validatedData.classLevelId,
        organizationId,
      },
    });

    if (!classLevel) {
      return NextResponse.json(
        { error: "Class level not found in organization" },
        { status: 404 }
      );
    }

    // Parse times and preserve local time
    const [startHours, startMinutes] = validatedData.startTime.split(':').map(Number);
    const [endHours, endMinutes] = validatedData.endTime.split(':').map(Number);

    // Create start and end dates based on month and year
    const startDate = new Date(validatedData.year, validatedData.month - 1, 1);
    const endDate = new Date(validatedData.year, validatedData.month, 0);

    // Create start and end time DateTime objects
    const startTime = new Date(validatedData.year, validatedData.month - 1, 1);
    startTime.setHours(startHours, startMinutes, 0, 0);
    console.log('Start time:', startTime);
    const endTime = new Date(validatedData.year, validatedData.month - 1, 1);
    endTime.setHours(endHours, endMinutes, 0, 0);
    console.log('End time:', endTime);
    // Update the lesson
    const updatedLesson = await prisma.lesson.update({
      where: {
        id: lessonId
      },
      data: {
        classLevelId: validatedData.classLevelId,
        instructorId: validatedData.instructorId,
        startDate,
        endDate,
        dayOfWeek: validatedData.dayOfWeek,
        startTime,
        endTime
      },
      include: {
        classLevel: true,
        instructor: {
          include: {
            user: true
          }
        }
      }
    });

    return NextResponse.json(updatedLesson);
  } catch (error) {
    console.error("Error updating lesson:", error);
    return NextResponse.json(
      { error: "Failed to update lesson" },
      { status: 500 }
    );
  }
} 