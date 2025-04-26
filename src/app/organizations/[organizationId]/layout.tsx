import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

interface LayoutProps {
  children: React.ReactNode;
  params: {
    organizationId: string;
  };
}

export default async function OrganizationLayout({ children, params }: LayoutProps) {
  console.log('OrganizationLayout - Rendering for organization:', params.organizationId);
  
  const session = await getServerSession(authOptions);

  if (!session) {
    console.log('OrganizationLayout - No session, redirecting to signin');
    redirect("/api/auth/signin");
  }

  console.log('OrganizationLayout - User session:', {
    id: session.user.id,
    role: session.user.role,
  });

  // For super admins, allow access to all organizations
  if (session.user.role === UserRole.SUPER_ADMIN) {
    const organization = await prisma.organization.findUnique({
      where: { id: params.organizationId },
    });

    if (!organization) {
      console.log('OrganizationLayout - Organization not found');
      redirect("/organizations");
    }

    console.log('OrganizationLayout - Rendering for super admin');
    return (
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">{organization.name}</h1>
            <p className="text-sm text-gray-500">
              Organization Management
            </p>
          </div>
          {children}
        </div>
      </div>
    );
  }

  // For regular admins, verify they are associated with this organization
  if (session.user.role === UserRole.ADMIN) {
    const admin = await prisma.admin.findFirst({
      where: {
        userId: session.user.id,
        organizationId: params.organizationId,
      },
      include: {
        organization: true,
      },
    });

    if (!admin) {
      console.log('OrganizationLayout - Admin not associated with organization');
      redirect("/");
    }

    console.log('OrganizationLayout - Rendering for organization admin');
    return (
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">{admin.organization.name}</h1>
            <p className="text-sm text-gray-500">
              Organization Management
            </p>
          </div>
          {children}
        </div>
      </div>
    );
  }

  console.log('OrganizationLayout - User not authorized, redirecting to home');
  // If not a super admin or organization admin, redirect to home
  redirect("/");
} 