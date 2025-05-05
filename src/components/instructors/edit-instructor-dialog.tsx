'use client';

import { useState } from "react";
import { Pencil } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { InstructorForm } from "./instructor-form";

interface EditInstructorDialogProps {
  organizationId: string;
  instructor: {
    id: string;
    userId: string;
    phoneNumber: string | null;
    user: {
      name: string;
      email: string;
    };
  };
}

export function EditInstructorDialog({ organizationId, instructor }: EditInstructorDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="ghost" size="icon" className="text-indigo-300 hover:text-indigo-900">
          <Pencil className="h-5 w-5" />
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg w-full max-w-md">
          
          {/* Header with Title + Description */}
          <div className="flex flex-col p-6 border-b">
            <Dialog.Title className="text-lg font-semibold">
              Edit Instructor
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-gray-500">
              Update the instructor’s name, email, or phone number and click Save when you’re done.
            </Dialog.Description>
          </div>

          {/* Form body */}
          <div className="p-6">
            <InstructorForm
              organizationId={organizationId}
              editingInstructor={instructor}
              onSuccess={() => setOpen(false)}
              onCancel={() => setOpen(false)}
            />
          </div>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}