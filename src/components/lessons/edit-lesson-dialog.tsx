'use client';

import { useState } from "react";
import { Pencil } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { LessonForm } from "./lesson-form";

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
}

export function EditLessonDialog({
  organizationId,
  classLevels,
  instructors,
  lesson,
}: EditLessonDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="outline" size="icon">
          <Pencil className="h-4 w-4" />
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-lg font-semibold">
              Edit Lesson
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-gray-400 hover:text-gray-500">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>
          <LessonForm
            organizationId={organizationId}
            classLevels={classLevels}
            instructors={instructors}
            onSuccess={() => setOpen(false)}
            onCancel={() => setOpen(false)}
            initialData={{
              id: lesson.id,
              classLevelId: lesson.classLevelId,
              instructorId: lesson.instructorId,
              month: lesson.month,
              year: lesson.year,
              dayOfWeek: lesson.dayOfWeek,
              startTime: lesson.startTime,
              endTime: lesson.endTime
            }}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
} 