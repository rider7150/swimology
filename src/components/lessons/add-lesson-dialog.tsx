'use client';

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { LessonForm } from "./lesson-form";
import { useRouter } from "next/navigation";

interface ClassLevel {
  id: string;
  name: string;
}

interface Instructor {
  id: string;
  user: {
    name: string;
  };
}

interface AddLessonDialogProps {
  organizationId: string;
  classLevels: ClassLevel[];
  instructors: {
    id: string;
    user: {
      name: string;
    };
  }[];
  onSuccess?: () => void;
}

export function AddLessonDialog({
  organizationId,
  classLevels,
  instructors,
  onSuccess,
}: AddLessonDialogProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleSuccess = () => {
    setOpen(false);
    router.refresh();
    onSuccess?.();
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="h-4 w-4" />
          Add Lesson
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
          
          {/* Header with Title + Description */}
          <div className="flex flex-col mb-4">
            <Dialog.Title className="text-lg font-semibold">
              Add New Lesson
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-gray-500">
              Choose a class level and instructor, then set the date and time for the lesson and click "Save."
            </Dialog.Description>
          </div>

          {/* Form body */}
          <LessonForm
            organizationId={organizationId}
            classLevels={classLevels}
            instructors={instructors}
            onSuccess={handleSuccess}
            onCancel={() => setOpen(false)}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}