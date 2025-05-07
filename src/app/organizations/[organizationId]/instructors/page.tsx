import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { InstructorList } from "@/components/instructors/instructor-list";
import { AddLessonDialog } from "@/components/lessons/add-lesson-dialog";
import { AddInstructorDialog } from "@/components/instructors/add-instructor-dialog";

interface PageProps {
  params: {
    organizationId: string;
  };
}

export default async function InstructorsPage({ params }: PageProps) {
  const { organizationId } = params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  // Check if user is authorized to access this page
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      admin: {
        select: {
          organizationId: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/");
  }

  // Allow access if user is super admin or an admin of this organization
  const isAuthorized =
    user.role === 'SUPER_ADMIN' ||
    (user.role === 'ADMIN' && user.admin?.organizationId === organizationId);

  if (!isAuthorized) {
    redirect("/");
  }

  const [organization, instructors, classLevels] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
      },
    }),
    prisma.instructor.findMany({
      where: {
        organizationId: organizationId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        lessons: {
          include: {
            classLevel: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    }),
    prisma.classLevel.findMany({
      where: {
        organizationId: organizationId,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        sortOrder: "asc",
      },
    }),
  ]);

  if (!organization) {
    redirect("/organizations");
  }

  // Transform instructors data for the AddLessonDialog component
  const simplifiedInstructors = instructors.map((instructor: any) => ({
    id: instructor.id,
    user: {
      name: instructor.user.name || 'Unnamed Instructor'
    }
  }));

  // Transform instructors data for the InstructorList component
  const transformedInstructors = instructors.map((instructor: any) => ({
    id: instructor.id,
    organizationId: instructor.organizationId,
    userId: instructor.userId,
    phoneNumber: instructor.phoneNumber,
    user: {
      id: instructor.user.id,
      name: instructor.user.name || 'Unnamed Instructor',
      email: instructor.user.email,
      role: instructor.user.role as string
    },
    lessons: instructor.lessons.map((lesson: any) => ({
      id: lesson.id,
      instructorId: instructor.id,
      classLevelId: lesson.classLevelId,
      startDate: lesson.startDate.toISOString(),
      endDate: lesson.endDate.toISOString(),
      dayOfWeek: lesson.dayOfWeek,
      startTime: lesson.startTime.toISOString(),
      endTime: lesson.endTime.toISOString(),
      month: new Date(lesson.startDate).getMonth() + 1,
      year: new Date(lesson.startDate).getFullYear(),
      classLevel: lesson.classLevel
    }))
  }));

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Manage Instructors & Lessons</h2>
            <p className="text-gray-600">
              Add and manage instructors and lessons for {organization.name}
            </p>
          </div>
        </div>

        <div>
          <InstructorList
            organizationId={organizationId}
            instructors={transformedInstructors}
            classLevels={classLevels}
          />
        </div>
      </div>
    </div>
  );
} 



