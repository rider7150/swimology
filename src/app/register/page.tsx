import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ParentRegistrationForm } from "@/components/parents/parent-registration-form";

export default async function RegisterPage() {
  const session = await getServerSession(authOptions);

  // Redirect if already logged in
  if (session) {
    redirect("/");
  }

  // Fetch all organizations
  const organizations = await prisma.organization.findMany({
    select: {
      id: true,
      name: true,
      membershipIdRequired: true,
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Create an Account</h1>
          <p className="mt-2 text-sm text-gray-600">
            Register as a parent to enroll your children in classes
          </p>
        </div>
        <ParentRegistrationForm organizations={organizations} />
      </div>
    </div>
  );
} 