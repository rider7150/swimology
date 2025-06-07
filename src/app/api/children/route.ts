import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

const childSchema = z.object({
  name: z.string().min(1, "Name is required"),
  birthDate: z.string(),
  lessonId: z.string().optional(),
});

// Define interfaces for the response types
interface Progress {
  skillId: string;
  status: string;
  notes?: string;
  strengthNotes?: string;
  improvementNotes?: string;
}

interface ClassLevel {
  id: string;
  name: string;
  sortOrder: number;
  color?: string;
  skills: Array<{
    id: string;
    name: string;
    description?: string | null;
  }>;
}

interface Lesson {
  id: string;
  classLevel: ClassLevel;
  startDate: Date;
  endDate: Date;
  dayOfWeek: number;
  startTime: Date;
  endTime: Date;
}

interface Enrollment {
  id: string;
  lesson: Lesson;
  progress: Progress[];
  readyForNextLevel?: boolean;
  strengthNotes?: string;
  improvementNotes?: string;
}

interface Child {
  id: string;
  name: string;
  birthDate: Date;
  enrollments: Enrollment[];
}

type PrismaChild = Awaited<ReturnType<typeof prisma.child.findMany>>[number];

type ChildWithEnrollments = PrismaChild & {
  enrollments: Array<{
    lesson: {
      classLevel: {
        id: string;
        name: string;
        sortOrder: number;
        color: string | null;
        skills: Array<{
          id: string;
          name: string;
          description: string | null;
        }>;
      };
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      startDate: Date;
      endDate: Date;
    };
    progress: Array<{
      skillId: string;
      status: string;
      notes: string | null;
      strengthNotes: string | null;
      improvementNotes: string | null;
    }>;
    readyForNextLevel: boolean | null;
    strengthNotes: string | null;
    improvementNotes: string | null;
  }>;
};

type InferredChild = Awaited<ReturnType<typeof getChildrenForParent>>;
type DbChild = InferredChild[number];

async function getChildrenForParent(parentId: string) {
  // Find all ParentChild joins for this parent
  const parentChildren = await prisma.parentChild.findMany({
    where: { parentId },
    include: {
      child: {
        include: {
          enrollments: {
            include: {
              lesson: {
                include: {
              classLevel: {
                include: {
                  skills: true,
                },
              },
            },
          },
          progress: true,
            },
          },
        },
      },
    },
  });
  // Return just the child objects
  return parentChildren.map((pc: any) => pc.child);
}

export async function POST(request: Request) {
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
    if (!parent) {
      return NextResponse.json(
        { error: "Parent record not found" },
        { status: 404 }
      );
    }
    const body = await request.json();
    const validatedData = childSchema.parse(body);
    // Create the child record and ParentChild join (and enrollment if lessonId is provided)
    const child = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const newChild = await tx.child.create({
        data: {
          name: validatedData.name,
          birthDate: new Date(validatedData.birthDate),
        },
      });
      // Create the ParentChild join
      await tx.parentChild.create({
        data: {
          parentId: parent.id,
          childId: newChild.id,
        },
      });
      if (validatedData.lessonId) {
        const lesson = await tx.lesson.findUnique({
          where: { id: validatedData.lessonId },
          include: { classLevel: { include: { skills: true } } },
        });
        if (!lesson) {
          throw new Error("Lesson not found");
        }
        // Check if child is already enrolled in a class of the same level
        const existingEnrollment = await tx.enrollment.findFirst({
          where: {
            childId: newChild.id,
            lesson: {
              classLevelId: lesson.classLevelId,
              endDate: {
                gte: new Date(),
              },
            },
          },
        });
        if (existingEnrollment) {
          throw new Error("Child is already enrolled in a class of this level");
        }
        const enrollment = await tx.enrollment.create({
          data: {
            childId: newChild.id,
            lessonId: validatedData.lessonId,
            startDate: lesson.startDate,
            endDate: lesson.endDate,
          },
        });
        // Create SkillProgress for all skills in the class level
        for (const skill of lesson.classLevel.skills) {
          await tx.skillProgress.create({
            data: {
              skillId: skill.id,
              enrollmentId: enrollment.id,
              status: "NOT_STARTED",
            },
          });
        }
      }
      return newChild;
    });
    return NextResponse.json(child);
  } catch (error) {
    console.error("Error adding child:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to add child" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    console.log("Children GET request received");
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }
    const parent = await prisma.parent.findFirst({
      where: { userId: session.user.id },
    });
    if (!parent) {
      return NextResponse.json(
        { error: "Parent not found" },
        { status: 404 }
      );
    }
    const children = await getChildrenForParent(parent.id);
    return NextResponse.json(
      children.map((child: any) => {
        return {
          id: child.id,
          name: child.name,
          birthDate: child.birthDate,
          lessons: (child.enrollments || []).map((enrollment: any) => {
            return {
              id: enrollment.lesson.id,
              name: enrollment.lesson.name,
              startDate: enrollment.lesson.startDate,
              endDate: enrollment.lesson.endDate,
              dayOfWeek: enrollment.lesson.dayOfWeek,
              startTime: enrollment.lesson.startTime,
              endTime: enrollment.lesson.endTime,
              classLevel: enrollment.lesson.classLevel
                ? {
                    id: enrollment.lesson.classLevel.id,
                    name: enrollment.lesson.classLevel.name,
                    color: enrollment.lesson.classLevel.color,
                    skills: (enrollment.lesson.classLevel.skills || []).map((skill: any) => ({
                      id: skill.id,
                      name: skill.name,
                      description: skill.description,
                    })),
                  }
                : null,
              progress: enrollment.progress || [],
              readyForNextLevel: enrollment.readyForNextLevel || false,
              strengthNotes: enrollment.strengthNotes || null,
              improvementNotes: enrollment.improvementNotes || null,
              enrollmentId: enrollment.id,
              skills: (enrollment.lesson.classLevel?.skills || []).map((skill: any) => {
                const prog = (enrollment.progress || []).find((p: any) => p.skillId === skill.id);
                return {
                  id: skill.id,
                  name: skill.name,
                  description: skill.description,
                  status: prog?.status || "NOT_STARTED",
                  notes: prog?.notes || null,
                  strengthNotes: prog?.strengthNotes || null,
                  improvementNotes: prog?.improvementNotes || null,
            };
              }),
            };
          }),
        };
      })
    );
  } catch (error) {
    console.error("Error fetching children:", error);
    return NextResponse.json(
      { error: "Failed to fetch children" },
      { status: 500 }
    );
  }
} 