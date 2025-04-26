"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@headlessui/react";
import { UserPlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";

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
        <h3 className="text-lg font-medium">Organization Admins</h3>
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

      <ul className="divide-y divide-gray-200">
        {admins.map((admin) => (
          <li key={admin.id} className="py-4 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {admin.user.name || "No name"}
              </p>
              <p className="text-sm text-gray-500">{admin.user.email}</p>
            </div>
            {session?.user.role === "SUPER_ADMIN" && admins.length > 1 && (
              <Button
                variant="destructive"
                onClick={() => handleRemoveAdmin(admin.id)}
                className="ml-4"
              >
                <XMarkIcon className="h-5 w-5" />
              </Button>
            )}
          </li>
        ))}
      </ul>

      <Dialog open={isOpen} onClose={() => setIsOpen(false)}>
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="relative bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <Dialog.Title className="text-lg font-medium mb-4">
              Add New Admin
            </Dialog.Title>

            <form onSubmit={handleAddAdmin}>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={newAdminName}
                    onChange={(e) => setNewAdminName(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                  Add Admin
                </Button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
} 