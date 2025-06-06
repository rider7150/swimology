'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AddAdminDialog } from "./add-admin-dialog";
import { EditAdminDialog } from "./edit-admin-dialog";
import { PencilIcon, Trash2Icon, X } from "lucide-react";
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
interface Admin {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

interface AdminsTableProps {
  organizationId: string;
}

export function AdminsTable({ organizationId }: AdminsTableProps) {
  const router = useRouter();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [adminToDelete, setAdminToDelete] = useState<Admin | null>(null);

  useEffect(() => {
    fetchAdmins();
  }, [organizationId]);

  const fetchAdmins = async () => {
    try {
      const response = await fetch(`/api/organizations/${organizationId}/admins`);
      if (!response.ok) {
        throw new Error("Failed to fetch admins");
      }
      const data = await response.json();
      setAdmins(data);
    } catch (error) {
      toast.error("Failed to fetch admins");
    }
  };

  const removeAdmin = async (admin: Admin) => {
    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/admins/${admin.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to remove admin");
      }

      toast.success("Admin removed successfully");
      fetchAdmins();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove admin");
    }
    setAdminToDelete(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end space-x-4">
        <AddAdminDialog organizationId={organizationId} onAdminAdded={fetchAdmins} />
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {admins.map((admin) => (
              <tr key={admin.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {admin.user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {admin.user.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <EditAdminDialog
                      organizationId={organizationId}
                      admin={admin}
                      onAdminUpdated={fetchAdmins}
                      trigger={
                          <Button variant="ghost" size="icon" className="text-indigo-300 hover:text-indigo-600">
                          <PencilIcon className="h-5 w-5" />
                          </Button>
                      }
                    />
                    <Button className="text-indigo-300 hover:text-red-600"
                      variant="ghost"
                      size="icon"
                      onClick={() => setAdminToDelete(admin)}
                    >
                      <Trash2Icon className="h-5 w-5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!adminToDelete} onOpenChange={() => setAdminToDelete(null)}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 z-50 bg-black/80" />
        <DialogContent>
          <div className="flex justify-between items-center">
            <DialogHeader>
              <DialogTitle  className="text-lg font-semibold text-red-600">Are you absolutely sure?</DialogTitle>
              <DialogDescription>
                This will permanently remove{" "}
                {adminToDelete?.user.name || adminToDelete?.user.email} as an
                admin from this organization. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
          </div>

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button
               variant="outline"
              >
                Cancel
              </Button>
            </DialogClose>

            <DialogClose asChild>
              <Button
                onClick={() => adminToDelete && removeAdmin(adminToDelete)}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Remove Admin
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </DialogPortal>
    </Dialog>
    </div>
  );
} 