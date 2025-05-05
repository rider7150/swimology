"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import { Dialog } from "@headlessui/react";
import { UserPlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline"; // Import icons

interface Admin {
  id: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface ManageAdminsProps {
  organizationId: string;
  admins: Admin[];
}

export function ManageAdmins({ organizationId, admins }: ManageAdminsProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [error, setError] = useState("");

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch(`/api/organizations/${organizationId}/admins`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newAdminName,
          email: newAdminEmail,
          password: newAdminPassword,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add admin");
      }

      setIsOpen(false);
      setNewAdminEmail("");
      setNewAdminName("");
      setNewAdminPassword("");
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to add admin");
    }
  };

  const handleRemoveAdmin = async (adminId: string) => {
    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/admins/${adminId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to remove admin");
      }

      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to remove admin");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        {session?.user.role === "SUPER_ADMIN" && (
          <Button onClick={() => setIsOpen(true)} className="flex items-center bg-blue-600 hover:bg-blue-700 text-white">
            <UserPlusIcon className="h-5 w-5 mr-2" />
            Add Admin
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
          {error}
        </div>
      )}

      <div className="shadow-md border border-gray-200 sm:rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th scope="col" className="relative px-6 py-3 text-right sticky right-0 bg-gray-50 w-24"> {/* Explicit width */}
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {admins.map((admin) => (
              <tr key={admin.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{admin.user.name || "No name"}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{admin.user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium sticky right-0 bg-white w-24"> {/* Explicit width */}
                  <div className="flex justify-end space-x-2"> {/* Added flex container */}
                    <Link
                      href={`/organizations/${organizationId}/admins/${admin.id}/edit`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <PencilIcon className="h-5 w-5 inline-block align-middle" /> <span className="sr-only">Edit</span>
                    </Link>
                    {session?.user.role === "SUPER_ADMIN" && admins.length > 1 && (
                      <button
                        onClick={() => handleRemoveAdmin(admin.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-5 w-5 inline-block align-middle" /> <span className="sr-only">Delete</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={isOpen} onClose={() => setIsOpen(false)}>
        {/* ... (rest of the Dialog component remains the same) ... */}
      </Dialog>
    </div>
  );
}