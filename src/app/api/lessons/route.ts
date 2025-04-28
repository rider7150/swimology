import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { format } from 'date-fns';

interface ClassLevel {
  id: string;
  name: string;
  description: string | null;
  color: string;
  sortOrder: number;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const instructor = await prisma.instructor.findFirst({
      where: {
        userId: session.user.id,
      },
    });

    if (instructor) {
      const lessons = await prisma.lesson.findMany({
        where: {
          instructorId: instructor.id,
        },
        include: {
          classLevel: true,
          instructor: {
            include: {
              user: true
            }
          },
          enrollments: {
            include: {
              child: true,
              progress: {
                include: {
                  skill: true
                }
              }
            }
          }
        },
        orderBy: {
          startDate: 'asc',
        }
      });

      // Transform the data to match the expected format
      const transformedLessons = lessons.map((lesson: unknown) => {
        // Format the time strings
        const startTime = format((lesson as any).startTime, 'HH:mm');
        const endTime = format((lesson as any).endTime, 'HH:mm');

        return {
          id: (lesson as any).id,
          month: (lesson as any).startDate.getMonth() + 1,
          year: (lesson as any).startDate.getFullYear(),
          dayOfWeek: (lesson as any).dayOfWeek,
          startTime,
          endTime,
          classLevel: {
            id: (lesson as any).classLevel.id,
            name: (lesson as any).classLevel.name,
            color: (lesson as any).classLevel.color,
            sortOrder: (lesson as any).classLevel.sortOrder,
            description: (lesson as any).classLevel.description
          },
          students: (lesson as any).enrollments.map((enrollment: unknown) => ({
            id: (enrollment as any).child.id,
            name: (enrollment as any).child.name,
            enrollmentId: (enrollment as any).id,
            classLevel: {
              id: (lesson as any).classLevel.id,
              name: (lesson as any).classLevel.name,
              color: (lesson as any).classLevel.color,
              sortOrder: (lesson as any).classLevel.sortOrder,
              description: (lesson as any).classLevel.description
            },
            skills: (enrollment as any).progress.map((p: unknown) => ({
              id: (p as any).skill.id,
              name: (p as any).skill.name,
              description: (p as any).skill.description,
              status: (p as any).status,
              notes: (p as any).notes
            })),
            readyForNextLevel: (enrollment as any).readyForNextLevel,
            strengthNotes: (enrollment as any).strengthNotes || "",
            improvementNotes: (enrollment as any).improvementNotes || ""
          }))
        };
      });

      return NextResponse.json(transformedLessons);
    } else {
      // For parents and other users, get all available lessons
      const lessons = await prisma.lesson.findMany({
        where: {
          endDate: {
            gte: new Date(),
          },
        },
        include: {
          classLevel: {
            select: {
              name: true,
            },
          },
          instructor: {
            include: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: [
          {
            startDate: 'asc',
          },
          {
            dayOfWeek: 'asc',
          },
        ],
      });

      // Transform data for parent view
      const transformedLessons = lessons.map((lesson: unknown) => ({
        id: (lesson as any).id,
        startDate: (lesson as any).startDate,
        endDate: (lesson as any).endDate,
        dayOfWeek: (lesson as any).dayOfWeek,
        startTime: (lesson as any).startTime,
        endTime: (lesson as any).endTime,
        classLevel: {
          name: (lesson as any).classLevel.name,
        },
        instructor: {
          user: {
            name: (lesson as any).instructor.user.name,
          },
        },
      }));

      return NextResponse.json(transformedLessons);
    }
  } catch (error) {
    console.error("Error fetching lessons:", error);
    return NextResponse.json(
      { error: "Failed to fetch lessons" },
      { status: 500 }
    );
  }
}

function formatTime(time: Date) {
  return time.toLocaleTimeString('en-US', { 
    hour: 'numeric',
    minute: '2-digit',
    hour12: true 
  });
}

function getDayName(dayOfWeek: number) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayOfWeek];
} 