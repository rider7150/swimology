import { Organization } from "@prisma/client";
import Link from "next/link";

interface OrganizationListProps {
  organizations: (Organization & {
    admins: {
      user: {
        name: string | null;
        email: string;
      };
    }[];
  })[];
}

export function OrganizationList({ organizations }: OrganizationListProps) {
  return (
    <div className="overflow-hidden bg-white shadow sm:rounded-md">
      <ul role="list" className="divide-y divide-gray-200">
        {organizations.map((organization) => (
          <li key={organization.id}>
            <Link
              href={`/organizations/${organization.id}`}
              className="block hover:bg-gray-50"
            >
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <p className="truncate text-sm font-medium text-indigo-600">
                      {organization.name}
                    </p>
                  </div>
                  <div className="ml-2 flex flex-shrink-0">
                    <p className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
                      {organization.admins.length} Admin
                      {organization.admins.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <p className="flex items-center text-sm text-gray-500">
                      {organization.admins.map((admin) => admin.user.name || admin.user.email).join(", ")}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                    <p>
                      Created on{" "}
                      {new Date(organization.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
} 