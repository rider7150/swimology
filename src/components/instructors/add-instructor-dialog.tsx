'use client';

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { X, Plus } from "lucide-react";
import { InstructorForm } from "./instructor-form";

interface AddInstructorDialogProps {
  organizationId: string;
}

export function AddInstructorDialog({ organizationId }: AddInstructorDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="h-4 w-4" />
          Add Instructor
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-lg font-semibold">
              Add New Instructor
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-gray-400 hover:text-gray-500">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>
          <InstructorForm
            organizationId={organizationId}
            onSuccess={() => {
              setOpen(false);
            }}
            onCancel={() => setOpen(false)}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
} 