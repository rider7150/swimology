import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrganizationDetails } from "@/components/organizations/organization-details";

interface OrganizationPageProps {
  params: {
    organizationId: string;
  };
}

export default async function OrganizationPage({
  params: { organizationId },
}: OrganizationPageProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/api/auth/signin");
  }

  // Allow access for super admins and org admins of this organization
  if (
    session.user.role !== "SUPER_ADMIN" &&
    !(session.user.role === "ADMIN" && session.user.organizationId === organizationId)
  ) {
    redirect("/");
  }

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
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
    redirect("/organizations");
  }

  return <OrganizationDetails organization={organization} />;
} 