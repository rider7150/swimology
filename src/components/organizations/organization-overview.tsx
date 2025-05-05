"use client";

import { useSession } from "next-auth/react";
import { DeleteOrganization } from "./delete-organization";
import { UserGroupIcon, BuildingOfficeIcon, UserIcon } from "@heroicons/react/24/outline";

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
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Organization Overview</h2>
        <p className="text-gray-600">Summary of your organization</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* ... (rest of the Organization Overview cards remain the same) ... */}
        <div className="bg-white rounded-md shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 text-blue-600 p-3 rounded-md">
              <UserGroupIcon className="h-6 w-6" />
            </div>
            <div className="ml-5">
              <p className="text-gray-500 text-sm font-medium truncate">Total Admins</p>
              <p className="text-3xl font-bold text-blue-600">{organization.admins.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-md shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 text-blue-600 p-3 rounded-md">
              <BuildingOfficeIcon className="h-6 w-6" />
            </div>
            <div className="ml-5">
              <p className="text-gray-500 text-sm font-medium truncate">Class Levels</p>
              <p className="text-3xl font-bold text-blue-600">{organization.classLevels.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-md shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 text-blue-600 p-3 rounded-md">
              <UserIcon className="h-6 w-6" />
            </div>
            <div className="ml-5">
              <p className="text-gray-500 text-sm font-medium truncate">Instructors</p>
              <p className="text-3xl font-bold text-blue-600">{organization.instructors.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-md shadow-sm">
        <div className="px-6 py-5">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h4>
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <label className="text-sm font-medium text-gray-500 sm:w-40"> {/* Added a fixed width on small screens */}
                Organization Name
              </label>
              <p className="mt-1 text-sm text-gray-900 sm:mt-0 sm:text-right">{organization.name}</p> {/* Right align on small screens */}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <label className="text-sm font-medium text-gray-500 sm:w-40">
                Membership ID Required
              </label>
              <p className="mt-1 text-sm text-gray-900 sm:mt-0 sm:text-right">
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