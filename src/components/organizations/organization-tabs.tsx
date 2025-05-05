"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from "@headlessui/react";

interface OrganizationTabsProps {
  organizationId: string;
}

export function OrganizationTabs({ organizationId }: OrganizationTabsProps) {
  const pathname = usePathname();
  const router = useRouter();

  const overviewHref = `/organizations/${organizationId}`;
  const tabs = [
    { name: "Overview", href: overviewHref },
    { name: "Admins", href: `${overviewHref}/admins` },
    { name: "Class Levels", href: `${overviewHref}/class-levels` },
    { name: "Instructors & Lessons", href: `${overviewHref}/instructors` },
    { name: "Parents", href: `${overviewHref}/parents` },
  ];

  // Overview only when exact match; others on startsWith
  const currentTab =
    tabs.find((tab) =>
      tab.href === overviewHref
        ? pathname === tab.href
        : pathname.startsWith(tab.href)
    ) ?? tabs[0];

  const handleTabSelect = (tab: { name: string; href: string }) => {
    router.push(tab.href);
  };

  return (
    <div className="border-b border-gray-200 sm:flex sm:space-x-6">
      {/* Dropdown for small screens */}
      <div className="sm:hidden relative w-full">
        <Listbox value={currentTab} onChange={handleTabSelect}>
          {() => (
            <>
              <ListboxButton className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm">
                <span className="block truncate">{currentTab.name}</span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              </ListboxButton>

              <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                {tabs.map((tab) => (
                  <ListboxOption
                    key={tab.name}
                    className={({ active }) =>
                      cn(
                        active
                          ? "bg-blue-100 text-blue-900"
                          : "text-gray-900",
                        "cursor-default select-none py-2 pl-3 pr-9"
                      )
                    }
                    value={tab}
                  >
                    {({ selected }) => (
                      <>
                        <span
                          className={cn(
                            selected ? "font-semibold" : "font-normal",
                            "block truncate"
                          )}
                        >
                          {tab.name}
                        </span>
  
                      </>
                    )}
                  </ListboxOption>
                ))}
              </ListboxOptions>
            </>
          )}
        </Listbox>
      </div>

      {/* Horizontal tabs for larger screens */}
      <nav className="hidden sm:flex space-x-6" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive =
            tab.href === overviewHref
              ? pathname === tab.href
              : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={cn(
                "py-2 px-4 text-sm font-medium focus:outline-none transition-colors duration-200",
                isActive
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-blue-600 border-b-2 border-transparent hover:border-blue-200"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {tab.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}