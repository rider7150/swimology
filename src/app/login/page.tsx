import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LoginPageContent } from "@/components/auth/login-page";
import { Toaster } from "@/components/ui/toaster";

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
    if (e instanceof Error) {
      dbStatus = "error: " + e.message;
    } else {
      dbStatus = "error: " + String(e);
    }
  }

  return (
    <>
      <LoginPageContent dbStatus={dbStatus} />
      <Toaster />
    </>
  );
} 