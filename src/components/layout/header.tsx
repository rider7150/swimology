"use client";

import React from 'react';
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="bg-gray-100 border-b border-gray-200 shadow-md">
      <div className="container mx-auto px-6 py-3 max-w-7xl">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Logo size={32} />
            <span className="text-xl font-semibold text-blue-600">
              Swimology
            </span>
          </Link>

          {session?.user && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 overflow-hidden ml-2 sm:ml-4"> {/* Added ml-2 and sm:ml-4 for spacing */}
                <span className="text-sm font-normal text-gray-700 truncate max-w-[120px]">
                  {session.user.name}
                </span>
              </div>
              <button
                onClick={() => signOut()}
                className="bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium py-1.5 px-3 rounded-md transition-colors duration-200 whitespace-nowrap"
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