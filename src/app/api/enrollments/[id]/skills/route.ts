import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@prisma/client";

const SkillStatus = {
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED'
} as const;

type SkillStatusType = typeof SkillStatus[keyof typeof SkillStatus];

const updateSkillsSchema = z.object({
  skills: z.array(z.object({
    id: z.string(),
    status: z.enum(['not_started', 'in_progress', 'completed']),
  })),
});

interface PrismaSkill {
  id: string;
  name: string;
  description: string | null;
}

interface PrismaProgress {
  skillId: string;
  status: SkillStatusType;
  notes: string | null;
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const enrollmentId = params.id;
    if (!enrollmentId) {
      return NextResponse.json(
        { error: "Enrollment ID is required" },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: "Enrollment not found" },
        { status: 404 }
      );
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
    return NextResponse.json(
      { error: "Failed to update skills" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const enrollmentId = params.id;
    if (!enrollmentId) {
      return NextResponse.json(
        { error: "Enrollment ID is required" },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: "Enrollment not found" },
        { status: 404 }
      );
    }

    // Map skills with their progress
    const skillsWithProgress = enrollment.lesson.skills.map((skill: PrismaSkill) => {
      const progress = enrollment.progress.find((p: PrismaProgress) => p.skillId === skill.id);
      return {
        id: skill.id,
        name: skill.name,
        description: skill.description,
        status: progress?.status || SkillStatus.NOT_STARTED,
        notes: progress?.notes || ''
      };
    });

    return NextResponse.json(skillsWithProgress);
  } catch (error) {
    console.error("[ENROLLMENT_SKILLS_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch skills" },
      { status: 500 }
    );
  }
} 