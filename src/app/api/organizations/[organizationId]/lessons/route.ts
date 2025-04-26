import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
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

export async function POST(
  request: Request,
  { params }: { params: { organizationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user;
    const { organizationId } = params;

    if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const body = await request.json();
    console.log('Request body:', body);
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

    const endTime = new Date(validatedData.year, validatedData.month - 1, 1);
    endTime.setHours(endHours, endMinutes, 0, 0);

    const lesson = await prisma.lesson.create({
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

    return NextResponse.json(lesson);
  } catch (error) {
    console.error("Error creating lesson:", error);
    return NextResponse.json(
      { error: "Failed to create lesson" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { organizationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user;
    const { organizationId } = await params;

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const lessons = await prisma.lesson.findMany({
      where: {
        classLevel: {
          organizationId,
        },
      },
      include: {
        instructor: true,
        classLevel: true,
      },
    });

    return NextResponse.json(lessons);
  } catch (error) {
    console.error("Error fetching lessons:", error);
    return NextResponse.json(
      { error: "Failed to fetch lessons" },
      { status: 500 }
    );
  }
}
