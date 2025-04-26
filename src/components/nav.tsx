"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Menu, Transition } from "@headlessui/react";
import { cn } from "@/lib/utils";

export function Nav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const navigation = [
    { name: "Home", href: "/" },
    ...(session?.user.role === "SUPER_ADMIN"
      ? [{ name: "Organizations", href: "/organizations" }]
      : []),
    ...(session?.user.role === "ADMIN" && session?.user.organizationId
      ? [{ name: "Organization", href: `/organizations/${session.user.organizationId}` }]
      : []),
    ...(session?.user.role === "INSTRUCTOR"
      ? [{ name: "Lessons", href: "/lessons" }]
      : []),
    ...(session?.user.role === "PARENT"
      ? [{ name: "Children", href: "/children" }]
      : []),
  ];

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              <Link href="/" className="text-xl font-bold text-indigo-600">
                Swimly
              </Link>
            </div>
            {session && (
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium",
                      pathname === item.href
                        ? "border-indigo-500 text-gray-900"
                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                    )}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {session ? (
              <Menu as="div" className="relative ml-3">
                <div>
                  <Menu.Button className="flex rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                    <span className="sr-only">Open user menu</span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                      <span className="text-sm font-medium text-gray-600">
                        {session.user.email?.[0].toUpperCase()}
                      </span>
                    </div>
                  </Menu.Button>
                </div>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-200"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => signOut()}
                          className={cn(
                            active ? "bg-gray-100" : "",
                            "block w-full px-4 py-2 text-left text-sm text-gray-700"
                          )}
                        >
                          Sign out
                        </button>
                      )}
                    </Menu.Item>
                  </Menu.Items>
                </Transition>
              </Menu>
            ) : (
              <div className="flex space-x-4">
                <Link
                  href="/login"
                  className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="bg-indigo-600 text-white hover:bg-indigo-500 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 