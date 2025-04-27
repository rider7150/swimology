"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface OrganizationTabsProps {
  organizationId: string;
}

export function OrganizationTabs({ organizationId }: OrganizationTabsProps) {
  const pathname = usePathname();
  const router = useRouter();
  //console.log('Current pathname:', pathname);
  //console.log('Organization ID:', organizationId);

  const tabs = [
    { name: 'Overview', href: `/organizations/${organizationId}` },
    { name: 'Admins', href: `/organizations/${organizationId}/admins` },
    { name: 'Class Levels', href: `/organizations/${organizationId}/class-levels` },
    { name: 'Instructors & Lessons', href: `/organizations/${organizationId}/instructors` },
    { name: 'Parents', href: `/organizations/${organizationId}/parents` },
  ];

  //console.log('Available tabs:', tabs.map(tab => ({ name: tab.name, href: tab.href })));

  const handleTabClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
   // console.log('Tab clicked, navigating to:', href);
    router.push(href);
  };

  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          //console.log(`Tab ${tab.name}:`, { href: tab.href, isActive, currentPath: pathname });
          return (
            <Link
              key={tab.name}
              href={tab.href}
              onClick={(e) => handleTabClick(e, tab.href)}
              className={cn(
                isActive
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              {tab.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
} 