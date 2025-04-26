'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TrashIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface DeleteClassLevelProps {
  organizationId: string;
  levelId: string;
  levelName: string;
  onSuccess?: () => void;
}

export function DeleteClassLevel({
  organizationId,
  levelId,
  levelName,
  onSuccess,
}: DeleteClassLevelProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/organizations/${organizationId}/class-levels/${levelId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete class level");
      }

      toast.success("Class level deleted successfully");
      setOpen(false);
      router.refresh();
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete class level");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-red-600 hover:text-red-900 hover:bg-red-50"
        >
          <TrashIcon className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you absolutely sure?</DialogTitle>
          <DialogDescription>
            This will permanently delete the {levelName} level and all its associated skills and lessons.
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? "Deleting..." : "Delete Level"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 