import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const progressSchema = z.object({
  skillId: z.string(),
  enrollmentId: z.string(),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]),
  notes: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Verify the instructor
    const instructor = await prisma.instructor.findFirst({
      where: { userId: session.user.id },
    });

    if (!instructor) {
      return NextResponse.json(
        { error: "Instructor record not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = progressSchema.parse(body);

    // Verify the enrollment belongs to a lesson taught by this instructor
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: validatedData.enrollmentId },
      include: {
        lesson: true,
      },
    });

    if (!enrollment || enrollment.lesson.instructorId !== instructor.id) {
      return NextResponse.json(
        { error: "Unauthorized to update this student's progress" },
        { status: 403 }
      );
    }

    // Update or create the skill progress
    const progress = await prisma.skillProgress.upsert({
      where: {
        skillId_enrollmentId: {
          skillId: validatedData.skillId,
          enrollmentId: validatedData.enrollmentId,
        }
      },
      update: {
        status: validatedData.status,
        notes: validatedData.notes,
      },
      create: {
        skillId: validatedData.skillId,
        enrollmentId: validatedData.enrollmentId,
        status: validatedData.status,
        notes: validatedData.notes,
      },
    });

    return NextResponse.json(progress);
  } catch (error) {
    console.error("Error updating skill progress:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update skill progress" },
      { status: 500 }
    );
  }
} 