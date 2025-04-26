'use client';

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { TrashIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

interface DeleteSkillProps {
  organizationId: string;
  levelId: string;
  skillId: string;
  skillName: string;
}

export function DeleteSkill({ organizationId, levelId, skillId, skillName }: DeleteSkillProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/organizations/${organizationId}/class-levels/${levelId}/skills/${skillId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete skill");
      }

      toast.success("Skill deleted successfully");
      router.refresh();
      setOpen(false);
    } catch (error) {
      toast.error("Failed to delete skill");
      console.error("Error deleting skill:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-red-600 hover:text-red-900 hover:bg-red-50"
        >
          <TrashIcon className="h-4 w-4" />
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-lg font-semibold text-red-600">
              Delete Skill
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-gray-400 hover:text-gray-500">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>
          <Dialog.Description className="mt-2 text-sm text-gray-500">
            Are you sure you want to delete {skillName}? This action cannot be undone.
          </Dialog.Description>
          <div className="mt-6 flex justify-end gap-3">
            <Dialog.Close asChild>
              <Button variant="outline">
                Cancel
              </Button>
            </Dialog.Close>
            <Button
              onClick={handleDelete}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? "Deleting..." : "Delete Skill"}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
} 