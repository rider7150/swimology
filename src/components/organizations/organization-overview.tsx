"use client";

import { useSession } from "next-auth/react";
import { DeleteOrganization } from "./delete-organization";

interface OrganizationOverviewProps {
  organization: {
    id: string;
    name: string;
    membershipIdRequired: boolean;
    createdAt: Date;
    updatedAt: Date;
    admins: {
      user: {
        name: string | null;
        email: string;
      };
    }[];
    classLevels: {
      id: string;
      name: string;
    }[];
    instructors: {
      user: {
        name: string | null;
        email: string;
      };
    }[];
  };
}

export function OrganizationOverview({ organization }: OrganizationOverviewProps) {
  const { data: session } = useSession();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Organization Overview</h3>
        <p className="text-sm text-gray-500">
          Summary of your organization
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Admins
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {organization.admins.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Class Levels
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {organization.classLevels.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Instructors
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {organization.instructors.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h4 className="text-lg font-medium text-gray-900">Basic Information</h4>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Organization Name
              </label>
              <p className="mt-1 text-sm text-gray-900">{organization.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Membership ID Required
              </label>
              <p className="mt-1 text-sm text-gray-900">
                {organization.membershipIdRequired ? "Yes" : "No"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {session?.user.role === "SUPER_ADMIN" && (
        <DeleteOrganization 
          organizationId={organization.id} 
          organizationName={organization.name} 
        />
      )}
    </div>
  );
} 