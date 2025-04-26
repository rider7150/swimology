import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrganizationTabs } from "@/components/organizations/organization-tabs";
import { SkillDialog } from "@/components/skills/skill-dialog";
import { Toaster } from "sonner";

interface Skill {
  id: string;
  name: string;
  description: string | null;
}

interface SkillsPageProps {
  params: Promise<{
    organizationId: string;
    levelId: string;
  }>;
}

export default async function SkillsPage({ params }: SkillsPageProps) {
  const { organizationId, levelId } = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const classLevel = await prisma.classLevel.findUnique({
    where: {
      id: levelId,
      organizationId: organizationId,
    },
    include: {
      organization: true,
      skills: true,
    },
  });

  if (!classLevel) {
    redirect("/organizations");
  }

  return (
    <>
      <OrganizationTabs organizationId={organizationId} />
      <Toaster />
      <main className="py-10">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="px-4 sm:px-0">
            <div className="sm:flex sm:items-center">
              <div className="sm:flex-auto">
                <h1 className="text-xl font-semibold text-gray-900">
                  Skills for {classLevel.name}
                </h1>
                <p className="mt-2 text-sm text-gray-700">
                  Manage skills that students need to master in this level
                </p>
              </div>
            </div>

            <div className="mt-8">
                <div className="overflow-hidden bg-white shadow sm:rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                  <div className="flex justify-end mb-4">
                    <SkillDialog
                      organizationId={organizationId}
                      levelId={levelId}
                    />
                  </div>
                    <div className="mt-4">
                      {classLevel.skills.length === 0 ? (
                        <p className="text-sm text-gray-500">No skills defined yet.</p>
                      ) : (
                        <ul role="list" className="divide-y divide-gray-200">
                        {classLevel.skills.map((skill: Skill) => (
                            <li key={skill.id} className="py-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="text-lg font-medium text-gray-900">
                                    {skill.name}
                                  </h4>
                                  {skill.description && (
                                    <p className="mt-1 text-sm text-gray-500">
                                      {skill.description}
                                    </p>
                                  )}
                                </div>
                              <div className="ml-4 flex-shrink-0 flex items-center space-x-4">
                                <SkillDialog
                                  organizationId={organizationId}
                                  levelId={levelId}
                                  editingSkill={skill}
                                />
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
} 