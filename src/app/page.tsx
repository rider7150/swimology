import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ParentDashboard from "@/components/parents/parent-dashboard";
import { InstructorDashboard } from "@/components/instructors/instructor-dashboard";
import { prisma } from "@/lib/prisma";
import { LandingPage } from '@/components/landing/landing-page';

async function getChildrenForParent(userId: string) {
  try {
    const parent = await prisma.parent.findFirst({
      where: { userId },
    });
    if (!parent) {
      return [];
    }
    // Use the join table to get all children for this parent
    const parentChildren = await prisma.parentChild.findMany({
      where: { parentId: parent.id },
      include: {
        child: {
          include: {
            enrollments: {
              include: {
                lesson: {
                  include: {
                    classLevel: {
                      include: {
                        skills: {
                          select: {
                            id: true,
                            name: true,
                            description: true,
                          },
                        },
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
    return parentChildren.map((pc: any) => {
      const child = pc.child;
      return {
        id: child.id,
        name: child.name,
        lessons: child.enrollments.map((enrollment: any) => {
          enrollment.lesson.classLevel.skills = enrollment.lesson.classLevel.skills.map((skill: any) => ({
            id: skill.id,
            name: skill.name,
            description: skill.description,
          }));
          // Build skills array by joining with progress
          const skills = enrollment.lesson.classLevel.skills.map((skill: any) => {
            const progress = enrollment.progress.find((p: any) => p.skillId === skill.id);
            return {
            ...skill,
              status: progress?.status || "NOT_STARTED",
            };
          });
          const completedSkills = skills.filter((s: any) => s.status === "COMPLETED").length;
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
              color: enrollment.lesson.classLevel.color,
            },
            dayOfWeek: enrollment.lesson.dayOfWeek,
            startTime: enrollment.lesson.startTime,
            endTime: enrollment.lesson.endTime,
            startDate: enrollment.lesson.startDate,
            endDate: enrollment.lesson.endDate,
            readyForNextLevel: enrollment.readyForNextLevel,
            strengthNotes: enrollment.strengthNotes ?? undefined,
            improvementNotes: enrollment.improvementNotes ?? undefined,
            enrollmentId: enrollment.id,
          };
        }),
        birthDate: child.birthDate,
      };
    });
  } catch (error) {
    console.error('Error fetching children:', error);
    return [];
  }
}

async function getLessonsForInstructor(userId: string) {
  try {
    const instructor = await prisma.instructor.findUnique({
      where: { userId },
    });

    if (!instructor) {
      console.log("No instructor found for user:", userId);
      return [];
    }

    const lessons = await prisma.lesson.findMany({
      where: {
        instructorId: instructor.id,
        endDate: {
          gte: new Date(),
        },
      },
      include: {
        classLevel: {
          include: {
            skills: {
              select: {
                id: true,
                name: true,
                description: true,
              }
            },
          },
        },
        enrollments: {
          include: {
            child: true,
            progress: {
              include: {
                skill: true,
              },
            },
          },
        },
      },
      orderBy: {
        startDate: 'asc',
      },
    });

    return lessons.map((lesson: unknown) => {
      (lesson as any).classLevel.skills = (lesson as any).classLevel.skills.map((skill: unknown) => ({
        id: (skill as any).id,
        name: (skill as any).name,
        description: (skill as any).description,
      }));
      return {
        id: (lesson as any).id,
        name: (lesson as any).classLevel.name,
        students: (lesson as any).enrollments.map((enrollment: unknown) => ({
          id: (enrollment as any).child.id,
          name: (enrollment as any).child.name,
          classLevel: {
            id: (lesson as any).classLevel.id,
            name: (lesson as any).classLevel.name,
            color: ((lesson as any).classLevel as any).color,
            sortOrder: (lesson as any).classLevel.sortOrder,
          },
          strengthNotes: (enrollment as any).strengthNotes ?? undefined,
          improvementNotes: (enrollment as any).improvementNotes ?? undefined,
          readyForNextLevel: (enrollment as any).readyForNextLevel,
          skills: ((lesson as any).classLevel.skills as Array<{ id: string; name: string; description?: string }> ).map((skill) => ({
            ...skill,
            status: ((enrollment as any).progress.find((p: unknown) => (p as any).skillId === skill.id)?.status as 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED') || 'NOT_STARTED'
          }))
        })),
        classLevel: {
          id: (lesson as any).classLevel.id,
          name: (lesson as any).classLevel.name,
          color: ((lesson as any).classLevel as any).color,
          sortOrder: (lesson as any).classLevel.sortOrder,
        },
        startDate: (lesson as any).startDate,
        endDate: (lesson as any).endDate,
        progress: 0, // Set a default value or calculate if available
        enrollmentId: "", // Set a default or derive from context if possible
        year: ((lesson as any).startDate instanceof Date ? (lesson as any).startDate.getFullYear() : new Date((lesson as any).startDate).getFullYear()),
        dayOfWeek: (lesson as any).dayOfWeek,
        startTime: (lesson as any).startTime,
        endTime: (lesson as any).endTime,
      };
    });
  } catch (error) {
    console.error("Error fetching instructor lessons:", error);
    return [];
  }
}

function formatTime(time: Date) {
  return time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function getDayName(dayOfWeek: number) {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
}

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return <LandingPage />;
  }

  // Redirect super admins to organizations page
  if (session.user.role === "SUPER_ADMIN") {
    redirect("/organizations");
  }

  // For other roles, show their respective dashboards
  const userRole = session.user.role;
  let dashboardContent;

  if (userRole === "PARENT") {
    const children = await getChildrenForParent(session.user.id);
    dashboardContent = <ParentDashboard children={children} />;
  } else if (userRole === "INSTRUCTOR") {
    const lessons = await getLessonsForInstructor(session.user.id);
    dashboardContent = <InstructorDashboard lessons={lessons} />;
  } else if (userRole === "ADMIN") {
    const organization = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      include: {
        instructors: {
          include: {
            user: true,
          },
        },
        classLevels: true,
        admins: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!organization) {
      dashboardContent = (
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Organization Admin Dashboard</h1>
          <p className="text-red-600">Organization not found. Please contact support.</p>
        </div>
      );
    } else {
      redirect(`/organizations/${organization.id}`);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {dashboardContent}
    </div>
  );
}
