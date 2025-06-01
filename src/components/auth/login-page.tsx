"use client";

import { useEffect } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { useToast } from "@/components/ui/use-toast";

interface LoginPageProps {
  dbStatus: string;
}

export function LoginPageContent({ dbStatus }: LoginPageProps) {
  const { toast } = useToast();

  useEffect(() => {
    if (dbStatus) {
    toast({
      title: "Database Status",
      description: dbStatus,
      duration: 3000, // 3 seconds
    });
    }
  }, [dbStatus, toast]);

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
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
} 