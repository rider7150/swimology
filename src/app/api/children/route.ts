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

type InferredChild = Awaited<ReturnType<typeof getChildren>>;
type DbChild = InferredChild[number];

async function getChildren(parentId: string) {
  return prisma.child.findMany({
    where: {
      parentId: parentId,
    },
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
  });
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

    // Create the child record and enrollment if lessonId is provided
    const child = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const newChild = await tx.child.create({
        data: {
          name: validatedData.name,
          birthDate: new Date(validatedData.birthDate),
          parentId: parent.id,
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
                gte: new Date()
              }
            }
          }
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

    const children = await getChildren(parent.id);

    return NextResponse.json(
      children.map((child: Awaited<ReturnType<typeof getChildren>>[number]) => {
        return {
          id: child.id,
          name: child.name,
          birthDate: child.birthDate,
          lessons: child.enrollments.map((enrollment: typeof child.enrollments[number]) => {
            type Skill = typeof enrollment.lesson.classLevel.skills[number];
            type Progress = typeof enrollment.progress[number];

            // Map skills to expected type
            const skills = enrollment.lesson.classLevel.skills.map((skill: Skill) => {
              const progressObj = enrollment.progress.find((p: Progress) => p.skillId === skill.id);
              return {
                id: skill.id,
                name: skill.name,
                description: skill.description,
                status: progressObj?.status || "NOT_STARTED",
                notes: progressObj?.notes || ""
              };
            });

            const completedSkills = skills.filter((skill: { status: string }) => skill.status === "COMPLETED").length;
            const progress = skills.length > 0 ? Math.round((completedSkills / skills.length) * 100) : 0;

            return {
              id: enrollment.lesson.id,
              name: enrollment.lesson.classLevel.name,
              progress,
              skills,
              classLevel: {
                id: enrollment.lesson.classLevel.id,
                name: enrollment.lesson.classLevel.name,
                sortOrder: enrollment.lesson.classLevel.sortOrder,
                color: enrollment.lesson.classLevel.color || "#3B82F6"
              },
              dayOfWeek: enrollment.lesson.dayOfWeek,
              startTime: enrollment.lesson.startTime.toISOString(),
              endTime: enrollment.lesson.endTime.toISOString(),
              startDate: enrollment.lesson.startDate,
              endDate: enrollment.lesson.endDate,
              readyForNextLevel: enrollment.readyForNextLevel || false,
              strengthNotes: enrollment.strengthNotes || "",
              improvementNotes: enrollment.improvementNotes || "",
              enrollmentId: enrollment.id
            };
          })
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