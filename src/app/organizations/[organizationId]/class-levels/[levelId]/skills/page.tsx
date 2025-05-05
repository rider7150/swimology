import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SkillDialog } from "@/components/skills/skill-dialog";
import { Toaster } from "sonner";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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
      <Toaster />
      <div className="space-y-6">
        <div className="space-y-6">
          <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Skills for {classLevel.name}
                </h2>
                <p className="text-gray-600">
                  Manage skills that students need to master in this level
                </p>
                </div>
            <div className="mb-4">
              <Link
                href={`/organizations/${organizationId}/class-levels`}
                className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Classes
              </Link>
            </div>
            <div className="flex justify-end mb-4">
                    <SkillDialog
                      organizationId={organizationId}
                      levelId={levelId}
                    />
                  </div>
    
          
            
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:p-6">

                  <div className="mt-4">
                    {classLevel.skills.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        No skills defined yet.
                      </p>
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
    </>
  );
}