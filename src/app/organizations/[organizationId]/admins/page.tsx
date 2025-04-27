import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminsTable } from "@/components/organizations/admins-table";

interface PageProps {
  params: {
    organizationId: string;
  };
}

export default async function AdminsPage({ params }: PageProps) {
  const { organizationId } = params;
  console.log('AdminsPage - Rendering for organization:', organizationId);

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    console.log('AdminsPage - No session user, redirecting to signin');
    redirect("/api/auth/signin");
  }

  console.log('AdminsPage - User session:', {
    id: session.user.id,
    role: session.user.role,
  });

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
    console.log('AdminsPage - User not found in database');
    redirect("/");
  }

  console.log('AdminsPage - User data:', {
    role: user.role,
    adminOrganizationId: user.admin?.organizationId,
  });

  // Allow access if user is super admin or an admin of this organization
  const isAuthorized =
    user.role === 'SUPER_ADMIN' ||
    (user.role === 'ADMIN' && user.admin?.organizationId === organizationId);

  console.log('AdminsPage - Authorization check:', {
    isSuperAdmin: user.role === 'SUPER_ADMIN',
    isOrgAdmin: user.role === 'ADMIN',
    requestedOrgId: organizationId,
    userOrgId: user.admin?.organizationId,
    isAuthorized,
  });

  if (!isAuthorized) {
    console.log('AdminsPage - User not authorized, redirecting to home');
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
    console.log('AdminsPage - Organization not found');
    redirect("/organizations");
  }

  console.log('AdminsPage - Rendering page for organization:', organization.name);

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manage Admins</h2>
          <p className="mt-2 text-sm text-gray-500">
            Add and manage administrators for {organization.name}
          </p>
        </div>

        <AdminsTable organizationId={organizationId} />
      </div>
    </div>
  );
} 