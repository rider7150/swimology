"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { UserCircleIcon } from "@heroicons/react/24/outline";
import { Logo } from "@/components/ui/logo";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="bg-grey-200 border-b border-swimly-text-light/10 shadow-soft">
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <Logo size={40} />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
              Swimology
            </span>
          </Link>

          {session?.user && (
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-900">
                  {session.user.name}
                </span>
              </div>
              <button
                onClick={() => signOut()}
                className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
} 