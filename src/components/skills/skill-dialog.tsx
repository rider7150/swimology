"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { SkillForm } from "./skill-form";
import { PlusIcon, PencilIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useState } from "react";
import { DeleteSkill } from "./delete-skill";
import { Input } from "@/components/ui/input";

interface SkillDialogProps {
  organizationId: string;
  levelId: string;
  editingSkill?: {
    id: string;
    name: string;
    description: string | null;
  } | null;
  onSuccess?: () => void;
}

export function SkillDialog({ organizationId, levelId, editingSkill, onSuccess }: SkillDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center space-x-2">
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger asChild>
          {editingSkill ? (
            <button
              type="button"
              className="text-indigo-600 hover:text-indigo-900"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
          ) : (
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Skills
            </Button>
          )}
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <Dialog.Title className="text-lg font-semibold">
                {editingSkill ? "Edit Skill" : "Add New Skill"}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="text-gray-400 hover:text-gray-500">
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>
            <SkillForm
              organizationId={organizationId}
              levelId={levelId}
              editingSkill={editingSkill}
              onSuccess={() => {
                setOpen(false);
                onSuccess?.();
              }}
              onCancel={() => setOpen(false)}
            />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      {editingSkill && (
        <DeleteSkill
          organizationId={organizationId}
          levelId={levelId}
          skillId={editingSkill.id}
          skillName={editingSkill.name}
        />
      )}
    </div>
  );
} 