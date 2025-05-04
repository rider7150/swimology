import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

interface Skill {
  id: string;
  name: string;
  description: string | null;
}

interface Progress {
  skillId: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  strengthNotes?: string;
  improvementNotes?: string;
}

interface ClassLevel {
  id: string;
  name: string;
  sortOrder: number;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Get the instructor record
    const instructor = await prisma.instructor.findFirst({
      where: { userId: session.user.id },
    });

    if (!instructor) {
      return NextResponse.json(
        { error: "Instructor record not found" },
        { status: 404 }
      );
    }

    // Ensure params.id exists
    if (!params?.id) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 }
      );
    }

    // Get the student with their enrollment and current progress
    const child = await prisma.child.findUnique({
      where: { id: params.id },
      include: {
        enrollments: {
          where: {
            lesson: {
              instructorId: instructor.id,
              endDate: {
                gte: new Date(), // Only get current enrollments
              },
            },
          },
          include: {
            lesson: {
              include: {
                classLevel: true,
              },
            },
            progress: true,
          },
        },
      },
    });

    if (!child || child.enrollments.length === 0) {
      return NextResponse.json(
        { error: "Student not found or not enrolled in your current lessons" },
        { status: 404 }
      );
    }

    const enrollment = child.enrollments[0];

    // Get all skills for the class level
    const skills = await prisma.skill.findMany({
      where: {
        classLevelId: enrollment.lesson.classLevel.id,
      },
      orderBy: {
        createdAt: 'asc', // Skills will be shown in the order they were created
      },
    });

    // If there are no SkillProgress records for this enrollment, create them
    if (!enrollment.progress || enrollment.progress.length === 0) {
      for (const skill of skills) {
        await prisma.skillProgress.create({
          data: {
            skillId: skill.id,
            enrollmentId: enrollment.id,
            status: "NOT_STARTED",
          },
        });
      }
      // Refetch the enrollment with progress
      const updatedChild = await prisma.child.findUnique({
        where: { id: params.id },
        include: {
          enrollments: {
            where: {
              lesson: {
                instructorId: instructor.id,
                endDate: {
                  gte: new Date(),
                },
              },
            },
            include: {
              lesson: {
                include: {
                  classLevel: true,
                },
              },
              progress: true,
            },
          },
        },
      });
      if (updatedChild && updatedChild.enrollments.length > 0) {
        child.enrollments[0].progress = updatedChild.enrollments[0].progress;
      }
    }

    // Transform the data to include all skills with their current status
    const studentData = {
      id: child.id,
      name: child.name,
      enrollmentId: enrollment.id,
      classLevel: {
        id: enrollment.lesson.classLevel.id,
        name: enrollment.lesson.classLevel.name,
        sortOrder: enrollment.lesson.classLevel.sortOrder,
      },
      readyForNextLevel: enrollment.readyForNextLevel,
      birthDate: child.birthDate,
      skills: skills.map((skill: Skill) => {
        const progress = enrollment.progress.find((p: Progress) => p.skillId === skill.id);
        return {
          id: skill.id,
          name: skill.name,
          description: skill.description,
          status: progress?.status || "NOT_STARTED"
        };
      })
    };

    return NextResponse.json(studentData);
  } catch (error) {
    console.error("Error fetching student:", error);
    return NextResponse.json(
      { error: "Failed to fetch student" },
      { status: 500 }
    );
  }
} 