import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const updateReadySchema = z.object({
  ready: z.boolean(),
});

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const params = await context.params;
    const enrollmentId = params.id;
    if (!enrollmentId) {
      return new NextResponse("Enrollment ID is required", { status: 400 });
    }

    const json = await request.json();
    const validatedData = updateReadySchema.parse(json);

    // Verify the enrollment exists
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        lesson: {
          include: {
            instructor: true
          }
        }
      }
    });

    if (!enrollment) {
      return new NextResponse("Enrollment not found", { status: 404 });
    }

    // Update the enrollment
    const updatedEnrollment = await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        readyForNextLevel: validatedData.ready,
      },
    });

    return NextResponse.json(updatedEnrollment);
  } catch (error) {
    console.error("[ENROLLMENT_READY_UPDATE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 