import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrganizationList } from "@/components/organizations/organization-list";
import { CreateOrganizationDialog } from "@/components/organizations/create-organization-dialog";

export default async function OrganizationsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "SUPER_ADMIN") {
    redirect("/");
  }

  const organizations = await prisma.organization.findMany({
    include: {
      admins: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="max-w-[80rem] mx-auto p-8">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Organizations</h1>
            <p className="mt-2 text-gray-600">
              Manage swim schools and their administrators
            </p>
          </div>
          <CreateOrganizationDialog />
        </div>
        <OrganizationList organizations={organizations} />
      </div>
    </div>
  );
} 