import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LoginForm } from "@/components/auth/login-form";
import { prisma } from "@/lib/prisma";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/");
  }

  let dbStatus = "unknown";
  try {
    const users = await prisma.user.findMany({ take: 1 });
    dbStatus = users.length ? "connected" : "connected, but no users";
  } catch (e) {
    dbStatus = "error: " + e.message;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
            Sign in to your account
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
          <div className="bg-white px-6 py-12 shadow sm:rounded-lg sm:px-12">
            <div>DB Status: {dbStatus}</div>
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
} 