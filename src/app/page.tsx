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
      include: {
        children: {
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
                          }
                        },
                      },
                    },
                  },
                },
                progress: true
              }
            }
          }
        }
      }
    });

    if (!parent) {
      return [];
    }

    return parent.children.map((child: unknown) => {
      return {
        id: (child as any).id,
        name: (child as any).name,
        lessons: (child as any).enrollments.map((enrollment: unknown) => {
          (enrollment as any).lesson.classLevel.skills = (enrollment as any).lesson.classLevel.skills.map((skill: unknown) => ({
            id: (skill as any).id,
            name: (skill as any).name,
            description: (skill as any).description,
          }));
          // Build skills array by joining with progress
          const skills = ((enrollment as any).lesson.classLevel.skills as Array<{ id: string; name: string; description?: string }> ).map((skill) => {
            const progress = (enrollment as any).progress.find((p: unknown) => (p as any).skillId === skill.id);
            return {
              ...skill,
              status: progress?.status || "NOT_STARTED"
            };
          });
          const completedSkills = skills.filter((s: unknown) => (s as any).status === "COMPLETED").length;
          const progress = skills.length > 0 ? Math.round((completedSkills / skills.length) * 100) : 0;
          return {
            id: (enrollment as any).lesson.id,
            name: (enrollment as any).lesson.classLevel.name,
            progress,
            skills,
            classLevel: {
              id: (enrollment as any).lesson.classLevel.id,
              name: (enrollment as any).lesson.classLevel.name,
              sortOrder: (enrollment as any).lesson.classLevel.sortOrder,
              color: ((enrollment as any).lesson.classLevel as any).color,
            },
            dayOfWeek: (enrollment as any).lesson.dayOfWeek,
            startTime: (enrollment as any).lesson.startTime,
            endTime: (enrollment as any).lesson.endTime,
            startDate: (enrollment as any).lesson.startDate,
            endDate: (enrollment as any).lesson.endDate,
            readyForNextLevel: (enrollment as any).readyForNextLevel,
            strengthNotes: (enrollment as any).strengthNotes ?? undefined,
            improvementNotes: (enrollment as any).improvementNotes ?? undefined
          };
        })
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
        month: ((lesson as any).startDate instanceof Date ? (lesson as any).startDate.getMonth() + 1 : new Date((lesson as any).startDate).getMonth() + 1),
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
      const { OrganizationDetails } = await import('@/components/organizations/organization-details');
      dashboardContent = <OrganizationDetails organization={organization} />;
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {dashboardContent}
    </div>
  );
}
