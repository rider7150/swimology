'use client';

import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface DeleteConfirmationDialogProps {
  onDelete: () => Promise<void>;
  isDeleting: boolean;
  itemType: 'instructor' | 'lesson' | 'child';
  itemName?: string;
}

export function DeleteConfirmationDialog({ onDelete, isDeleting, itemType, itemName }: DeleteConfirmationDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-indigo-300 hover:text-red-600"
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <div className="flex justify-between items-center">
          <AlertDialogHeader className="flex-1">
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {itemType === 'instructor' 
                ? `This will permanently delete ${itemName ? `instructor ${itemName}` : 'this instructor'} and all their associated lessons.`
                : itemType === 'lesson'
                ? `This will permanently delete ${itemName ? `the lesson for ${itemName}` : 'this lesson'} and all associated data.`
                : `This will permanently delete ${itemName ? `child ${itemName}` : 'this child'} and all their associated data.`
              } This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onDelete();
            }}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 