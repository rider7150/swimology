import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ParentDashboard from "@/components/parents/parent-dashboard";
import { InstructorDashboard } from "@/components/instructors/instructor-dashboard";

interface Skill {
  id: string;
  name: string;
  description?: string;
  strengthNotes?: string;
  improvementNotes?: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
}

interface ClassLevel {
  id: string;
  name: string;
  sortOrder: number;
  color?: string;
  skills: Array<{ id: string; name: string; description?: string }>;
}

interface DbChild {
  id: string;
  name: string;
  enrollments: Array<{
    lesson: {
      id: string;
      classLevel: {
        id: string;
        name: string;
        sortOrder: number;
        color?: string;
        skills: Array<{ id: string; name: string; description?: string }>;
      };
      dayOfWeek: number;
      startTime: Date;
      endTime: Date;
      startDate: Date;
      endDate: Date;
    };
    progress: Array<{
      skillId: string;
      status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
    }>;
    readyForNextLevel: boolean;
    strengthNotes?: string | null;
    improvementNotes?: string | null;
  }>;
}

interface LessonWithDetails {
  id: string;
  startTime: Date;
  endTime: Date;
  startDate: Date;
  endDate: Date;
  dayOfWeek: number;
  classLevel: ClassLevel;
  enrollments: Array<{
    id: string;
    child: {
      id: string;
      name: string;
    };
    progress: Array<{
      skillId: string;
      status: string;
    }>;
    strengthNotes?: string | null;
    improvementNotes?: string | null;
    readyForNextLevel: boolean;
  }>;
}

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

    return parent.children.map((child: any) => {
      return {
        id: child.id,
        name: child.name,
        lessons: child.enrollments.map((enrollment: any) => {
          // Map skills to expected type right after fetching
          enrollment.lesson.classLevel.skills = enrollment.lesson.classLevel.skills.map((skill: any) => ({
            id: skill.id,
            name: skill.name,
            description: skill.description ?? null,
          }));
          // Build skills array by joining with progress
          const skills = (enrollment.lesson.classLevel.skills as Array<{ id: string; name: string; description?: string }> ).map((skill) => {
            const progress = enrollment.progress.find((p: any) => p.skillId === skill.id);
            return {
              ...skill,
              status: progress?.status || "NOT_STARTED"
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
              color: (enrollment.lesson.classLevel as any).color,
            },
            dayOfWeek: enrollment.lesson.dayOfWeek,
            startTime: enrollment.lesson.startTime.toISOString(),
            endTime: enrollment.lesson.endTime.toISOString(),
            startDate: enrollment.lesson.startDate.toISOString(),
            endDate: enrollment.lesson.endDate.toISOString(),
            readyForNextLevel: enrollment.readyForNextLevel,
            strengthNotes: enrollment.strengthNotes ?? undefined,
            improvementNotes: enrollment.improvementNotes ?? undefined
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

    return lessons.map((lesson: any) => {
      // Map skills to expected type right after fetching
      lesson.classLevel.skills = lesson.classLevel.skills.map((skill: any) => ({
        id: skill.id,
        name: skill.name,
        description: skill.description ?? null,
      }));
      const mappedSkills = lesson.classLevel.skills as Array<{ id: string; name: string; description?: string }>;
      return {
        id: lesson.id,
        name: `${lesson.classLevel.name} - ${formatTime(lesson.startTime)} ${getDayName(lesson.dayOfWeek)}`,
        classLevel: {
          id: lesson.classLevel.id,
          name: lesson.classLevel.name,
          color: (lesson.classLevel as any).color,
          sortOrder: lesson.classLevel.sortOrder
        },
        month: lesson.startDate.getMonth() + 1,
        year: lesson.startDate.getFullYear(),
        dayOfWeek: lesson.dayOfWeek,
        startTime: lesson.startTime.toISOString(),
        endTime: lesson.endTime.toISOString(),
        startDate: lesson.startDate.toISOString(),
        endDate: lesson.endDate.toISOString(),
        students: lesson.enrollments.map((enrollment: any) => ({
          id: enrollment.child.id,
          name: enrollment.child.name,
          enrollmentId: enrollment.id,
          classLevel: {
            id: lesson.classLevel.id,
            name: lesson.classLevel.name,
            color: (lesson.classLevel as any).color,
            sortOrder: lesson.classLevel.sortOrder
          },
          strengthNotes: enrollment.strengthNotes ?? undefined,
          improvementNotes: enrollment.improvementNotes ?? undefined,
          readyForNextLevel: enrollment.readyForNextLevel,
          skills: mappedSkills.map((skill: any) => ({
            ...skill,
            status: (enrollment.progress.find((p: any) => p.skillId === skill.id)?.status as 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED') || 'NOT_STARTED'
          }))
        })),
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

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/api/auth/signin");
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
