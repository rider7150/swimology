import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { format } from 'date-fns';

interface Skill {
  id: string;
  name: string;
  description?: string | null;
}

interface Progress {
  skillId: string;
  status: string;
  notes?: string;
}

interface Enrollment {
  id: string;
  child: { id: string; name: string };
  progress: Progress[];
  readyForNextLevel?: boolean;
  strengthNotes?: string;
  improvementNotes?: string;
}

interface Lesson {
  id: string;
  classLevel: {
    id: string;
    name: string;
    color?: string;
    sortOrder: number;
    description?: string | null;
    skills: Skill[];
  };
  instructor: {
    user: { name: string };
  };
  enrollments: Enrollment[];
  startDate: Date;
  endDate: Date;
  dayOfWeek: number;
  startTime: Date;
  endTime: Date;
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
      const transformedLessons = lessons.map((lesson: any) => {
        // Format the time strings
        //const startTime = format(lesson.startTime, 'HH:mm');
        //const endTime = format(lesson.endTime, 'HH:mm');
       // const startTime = formatTime(lesson.startTime);
        // const endTime = formatTime(lesson.endTime) ;
        // console.log('startTime', startTime);
        // console.log('endTime', endTime);
        return {
          id: lesson.id,
          month: lesson.startDate.getMonth() + 1,
          year: lesson.startDate.getFullYear(),
          dayOfWeek: lesson.dayOfWeek,
          startTime: lesson.startTime,
          endTime: lesson.endTime,
          classLevel: {
            id: lesson.classLevel.id,
            name: lesson.classLevel.name,
            color: lesson.classLevel.color,
            sortOrder: lesson.classLevel.sortOrder,
            description: lesson.classLevel.description
          },
          students: lesson.enrollments.map((enrollment: any) => ({
            id: enrollment.child.id,
            name: enrollment.child.name,
            enrollmentId: enrollment.id,
            classLevel: {
              id: lesson.classLevel.id,
              name: lesson.classLevel.name,
              color: lesson.classLevel.color,
              sortOrder: lesson.classLevel.sortOrder,
              description: lesson.classLevel.description
            },
            skills: enrollment.progress.map((p: any) => ({
              id: p.skill ? p.skill.id : p.skillId,
              name: p.skill ? p.skill.name : '',
              description: p.skill ? p.skill.description : '',
              status: p.status,
              notes: p.notes
            })),
            readyForNextLevel: enrollment.readyForNextLevel,
            strengthNotes: enrollment.strengthNotes || "",
            improvementNotes: enrollment.improvementNotes || ""
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
      const transformedLessons = lessons.map((lesson: any) => ({
        id: lesson.id,
        startDate: lesson.startDate,
        endDate: lesson.endDate,
        dayOfWeek: lesson.dayOfWeek,
        startTime: lesson.startTime,
        endTime: lesson.endTime,
        classLevel: {
          name: lesson.classLevel.name,
        },
        instructor: {
          user: {
            name: lesson.instructor.user.name,
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
    hour12: true ,
    timeZone: 'America/Los_Angeles'
  });
}

function getDayName(dayOfWeek: number) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayOfWeek];
} 