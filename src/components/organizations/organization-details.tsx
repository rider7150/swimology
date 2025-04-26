"use client";

import { type Prisma } from "@prisma/client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { TrashIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { OrganizationTabs } from "./organization-tabs";
import { OrganizationOverview } from "./organization-overview";

interface ClassLevel {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  organizationId: string;
}

interface Organization {
  id: string;
  name: string;
  membershipIdRequired: boolean;
}

interface Admin {
  id: string;
  userId: string;
  organizationId: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
}

interface OrganizationWithRelations extends Organization {
  admins: Admin[];
  classLevels: ClassLevel[];
  instructors: {
    user: {
      name: string | null;
      email: string;
    };
  }[];
}

interface OrganizationDetailsProps {
  organization: OrganizationWithRelations;
}

export function OrganizationDetails({ organization }: OrganizationDetailsProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDeleteOrganization = async () => {
    if (!confirm("Are you sure you want to delete this organization? This action cannot be undone.")) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/organizations/${organization.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete organization");
      }

      router.push("/organizations");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to delete organization");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md">
          {error}
        </div>
      )}

      <OrganizationTabs organizationId={organization.id} />
      
      <OrganizationOverview organization={organization} />
    </div>
  ); 
} 