'use client';

import { useState } from "react";
import { Pencil } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
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

interface EditLessonDialogProps {
  organizationId: string;
  classLevels: ClassLevel[];
  instructors: Instructor[];
  lesson: {
    id: string;
    classLevelId: string;
    instructorId: string;
    month: number;
    year: number;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  };
  onSuccess?: () => void;
}

export function EditLessonDialog({
  organizationId,
  classLevels,
  instructors,
  lesson,
  onSuccess,
}: EditLessonDialogProps) {
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
        <Button variant="ghost" size="icon" className="text-indigo-300 hover:text-indigo-600">
          <Pencil className="h-5 w-5" />
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
          
          {/* Header with Title + Description */}
          <div className="flex flex-col mb-4">
            <Dialog.Title className="text-lg font-semibold">
              Edit Lesson
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-gray-500">
              Update the lesson's class level, instructor, date, and time, then click Save.
            </Dialog.Description>
          </div>

          {/* Form body */}
          <LessonForm
            organizationId={organizationId}
            classLevels={classLevels}
            instructors={instructors}
            onSuccess={handleSuccess}
            onCancel={() => setOpen(false)}
            initialData={{
              id: lesson.id,
              classLevelId: lesson.classLevelId,
              instructorId: lesson.instructorId,
              month: lesson.month,
              year: lesson.year,
              dayOfWeek: lesson.dayOfWeek,
              startTime: lesson.startTime,
              endTime: lesson.endTime,
            }}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}