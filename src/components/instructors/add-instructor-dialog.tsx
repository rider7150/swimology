'use client';

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
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
          
          {/* Header with Title + Description */}
          <div className="flex flex-col mb-4">
            <Dialog.Title className="text-lg font-semibold">
              Add New Instructor
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-gray-500">
              Enter the instructor’s name, email, and phone number, then click Save to add them to your organization.
            </Dialog.Description>
          </div>

          {/* Form body */}
          <InstructorForm
            organizationId={organizationId}
            onSuccess={() => setOpen(false)}
            onCancel={() => setOpen(false)}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}