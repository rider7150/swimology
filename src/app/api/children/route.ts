import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const childSchema = z.object({
  name: z.string().min(1, "Name is required"),
  birthDate: z.string(),
  lessonId: z.string().optional(),
});

type DbChild = {
  id: string;
  name: string;
  enrollments: Array<{
    lesson: {
      id: string;
      startDate: Date;
      endDate: Date;
      dayOfWeek: number;
      startTime: Date;
      endTime: Date;
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
    };
    progress: Array<{
      skillId: string;
      status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
      strengthNotes: string | null;
      improvementNotes: string | null;
    }>;
    readyForNextLevel: boolean;
    strengthNotes: string | null;
    improvementNotes: string | null;
  }>;
};

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

    // Get the parent record
    const parent = await prisma.parent.findFirst({
      where: { userId: session.user.id },
    });

    if (!parent) {
      return NextResponse.json(
        { error: "Parent record not found" },
        { status: 404 }
      );
    }

    // Get all children with their enrollments and progress
    const children = await prisma.child.findMany({
      where: {
        parentId: parent.id,
      },
      include: {
        enrollments: {
          where: {
            endDate: {
              gte: new Date(), // Only get current enrollments
            },
          },
          include: {
            lesson: {
              include: {
                classLevel: {
                  include: {
                    skills: true
                  }
                }
              }
            },
            progress: true,
          },
        },
      },
    });

    // Transform the data to include progress calculations
    return NextResponse.json(
      children.map((child: { 
        id: string;
        name: string;
        birthDate: Date;
        enrollments: any[];
      }) => ({
        id: child.id,
        name: child.name,
        birthDate: child.birthDate,
        lessons: child.enrollments.map((enrollment) => {
          // Build skills array first
          const skills = enrollment.lesson.classLevel.skills.map((skill: any) => {
            const progressObj = enrollment.progress.find((p: any) => p.skillId === skill.id) || {};
            return {
              id: skill.id,
              name: skill.name,
              description: skill.description,
              status: 'status' in progressObj ? progressObj.status : "NOT_STARTED",
              notes: 'notes' in progressObj ? progressObj.notes : "",
              strengthNotes: 'strengthNotes' in progressObj ? progressObj.strengthNotes : "",
              improvementNotes: 'improvementNotes' in progressObj ? progressObj.improvementNotes : ""
            };
          });

          const completedSkills = skills.filter((skill: any) => skill.status === "COMPLETED").length;
          const progress = skills.length > 0 ? Math.round((completedSkills / skills.length) * 100) : 0;

          const startDate = new Date(enrollment.lesson.startDate);
          const month = startDate.toLocaleString('default', { month: 'long' });

          return {
            id: enrollment.lesson.id,
            enrollmentId: enrollment.id,
            name: enrollment.lesson.classLevel.name,
            progress,
            skills,
            classLevel: {
              id: enrollment.lesson.classLevel.id,
              name: enrollment.lesson.classLevel.name,
              sortOrder: enrollment.lesson.classLevel.sortOrder,
              color: 'color' in enrollment.lesson.classLevel && enrollment.lesson.classLevel.color ? enrollment.lesson.classLevel.color : "#3B82F6"
            },
            month,
            dayOfWeek: enrollment.lesson.dayOfWeek,
            startTime: enrollment.lesson.startTime,
            endTime: enrollment.lesson.endTime,
            startDate: enrollment.lesson.startDate,
            endDate: enrollment.lesson.endDate,
            readyForNextLevel: enrollment.readyForNextLevel,
            strengthNotes: enrollment.strengthNotes || "",
            improvementNotes: enrollment.improvementNotes || ""
          };
        })
      }))
    );
  } catch (error) {
    console.error("Error fetching children:", error);
    return NextResponse.json(
      { error: "Failed to fetch children" },
      { status: 500 }
    );
  }
} 