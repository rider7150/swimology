import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ClassLevelsTable } from "@/components/class-levels/class-levels-table";
import { Suspense } from "react";

interface PageProps {
  params: {
    organizationId: string;
  };
}

export default async function ClassLevelsPage({ params }: PageProps) {
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

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      id: true,
      name: true,
    },
  });

  if (!organization) {
    redirect("/organizations");
  }

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Manage Class Levels</h2>
          <p className="text-gray-600">
            Add and manage class levels for {organization.name}
          </p>
        </div>

        <Suspense fallback={<div>Loading class levels...</div>}>
          <ClassLevelsTable organizationId={organizationId} />
        </Suspense>
      </div>
    </div>
  );
} 
