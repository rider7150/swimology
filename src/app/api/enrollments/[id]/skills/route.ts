import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SkillStatus } from "@prisma/client";

const updateSkillsSchema = z.object({
  skills: z.array(z.object({
    id: z.string(),
    status: z.enum(['not_started', 'in_progress', 'completed']),
  })),
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
    const validatedData = updateSkillsSchema.parse(json);

    // Verify the enrollment exists
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        lesson: {
          include: {
            instructor: true,
            skills: true
          }
        },
        progress: true
      }
    });

    if (!enrollment) {
      return new NextResponse("Enrollment not found", { status: 404 });
    }

    // Update or create progress records for each skill
    const progressUpdates = validatedData.skills.map(skill => ({
      where: {
        skillId_enrollmentId: {
          skillId: skill.id,
          enrollmentId: enrollmentId
        },
      },
      create: {
        enrollmentId: enrollmentId,
        skillId: skill.id,
        status: SkillStatus[skill.status.toUpperCase() as keyof typeof SkillStatus],
      },
      update: {
        status: SkillStatus[skill.status.toUpperCase() as keyof typeof SkillStatus],
      },
    }));

    // Execute all updates in a transaction
    const results = await prisma.$transaction(
      progressUpdates.map(update =>
        prisma.skillProgress.upsert(update)
      )
    );

    return NextResponse.json(results);
  } catch (error) {
    console.error("[ENROLLMENT_SKILLS_UPDATE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function GET(
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

    // Fetch enrollment with skills and progress
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        lesson: {
          include: {
            skills: true
          }
        },
        progress: true
      }
    });

    if (!enrollment) {
      return new NextResponse("Enrollment not found", { status: 404 });
    }

    type Skill = {
      id: string;
      name: string;
      description: string | null;
    };

    type Progress = {
      skillId: string;
      status: string;
      notes: string | null;
    };

    // Map skills with their progress
    const skillsWithProgress = enrollment.lesson.skills.map((skill: Skill) => {
      const progress = enrollment.progress.find((p: Progress) => p.skillId === skill.id);
      return {
        ...skill,
        status: progress?.status || 'not_started',
        notes: progress?.notes || ''
      };
    });

    return NextResponse.json(skillsWithProgress);
  } catch (error) {
    console.error("[ENROLLMENT_SKILLS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 