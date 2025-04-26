"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const skillSchema = z.object({
  name: z.string().min(1, "Skill name is required"),
  description: z.string().optional(),
});

type SkillFormData = z.infer<typeof skillSchema>;

interface SkillFormProps {
  organizationId: string;
  levelId: string;
  editingSkill?: {
    id: string;
    name: string;
    description: string | null;
  } | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function SkillForm({
  organizationId,
  levelId,
  editingSkill,
  onSuccess,
  onCancel,
}: SkillFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SkillFormData>({
    resolver: zodResolver(skillSchema),
    defaultValues: {
      name: editingSkill?.name || "",
      description: editingSkill?.description || "",
    },
  });

  const onSubmit = async (data: SkillFormData) => {
    try {
      setError(null);
      setLoading(true);

      const url = editingSkill
        ? `/api/organizations/${organizationId}/class-levels/${levelId}/skills/${editingSkill.id}`
        : `/api/organizations/${organizationId}/class-levels/${levelId}/skills`;

      const response = await fetch(url, {
        method: editingSkill ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${editingSkill ? "update" : "create"} skill`);
      }

      reset();
      router.refresh();
      onSuccess?.();
      if (editingSkill) {
        onCancel?.();
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(`Failed to ${editingSkill ? "update" : "create"} skill. Please try again.`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Skill Name
          </label>
        <Input
              id="name"
              {...register("name")}
          className="mt-1"
              placeholder="e.g., Freestyle, Backstroke, Diving"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700"
          >
            Description
          </label>
            <textarea
              id="description"
              {...register("description")}
              rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900"
              placeholder="Describe what students need to learn for this skill"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">
                {errors.description.message}
              </p>
            )}
        </div>

      <div className="flex justify-end gap-3 mt-6">
        <Button
              type="button"
          variant="outline"
              onClick={onCancel}
            >
              Cancel
        </Button>
        <Button
            type="submit"
            disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? (editingSkill ? "Updating..." : "Creating...") : (editingSkill ? "Update" : "Create")} Skill
        </Button>
        </div>
      </form>
  );
} 