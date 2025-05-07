'use client';

import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteConfirmationDialogProps {
  onDelete: () => Promise<void>;
  isDeleting: boolean;
  itemType: 'instructor' | 'lesson' | 'child';
  itemName?: string;
}

export function DeleteConfirmationDialog({ onDelete, isDeleting, itemType, itemName }: DeleteConfirmationDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-indigo-300 hover:text-red-600"
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </DialogTrigger>

      <DialogPortal>
        <DialogOverlay />

        <DialogContent>
          <DialogHeader className="flex-1">
            <DialogTitle  className="text-lg font-semibold text-red-600">Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              {itemType === "instructor"
                ? `This will permanently delete ${itemName ? `instructor ${itemName}` : "this instructor"} and all their associated lessons.`
                : itemType === "lesson"
                ? `This will permanently delete ${itemName ? `the lesson for ${itemName}` : "this lesson"} and all associated data.`
                : `This will permanently delete ${itemName ? `child ${itemName}` : "this child"} and all their associated data.`
              } This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="space-x-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>

            <DialogClose asChild>
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  onDelete();
                }}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </DialogPortal>
    </Dialog>






  );
} 