"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const classLevelSchema = z.object({
  name: z.string().min(1, "Level name is required"),
  description: z.string().optional(),
  sortOrder: z.number().min(0, "Order must be a positive number"),
});

type ClassLevelFormData = z.infer<typeof classLevelSchema>;

interface ClassLevelFormProps {
  organizationId: string;
  editingLevel?: {
    id: string;
    name: string;
    description: string | null;
    sortOrder: number;
  } | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ClassLevelForm({
  organizationId,
  editingLevel,
  onSuccess,
  onCancel,
}: ClassLevelFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ClassLevelFormData>({
    resolver: zodResolver(classLevelSchema),
    defaultValues: {
      name: editingLevel?.name || "",
      description: editingLevel?.description || "",
      sortOrder: editingLevel?.sortOrder || 0,
    },
  });

  const onSubmit = async (data: ClassLevelFormData) => {
    try {
      setError(null);
      setLoading(true);

      const url = editingLevel
        ? `/api/organizations/${organizationId}/class-levels/${editingLevel.id}`
        : `/api/organizations/${organizationId}/class-levels`;

      const response = await fetch(url, {
        method: editingLevel ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${editingLevel ? "update" : "create"} class level`);
      }

      reset();
      router.refresh();
      onSuccess?.();
      if (editingLevel) {
        onCancel?.();
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(`Failed to ${editingLevel ? "update" : "create"} class level. Please try again.`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 shadow sm:rounded-lg">
      <h2 className="text-lg font-medium text-gray-900">
        {editingLevel ? "Edit" : "Add"} Class Level
      </h2>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
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
            Level Name
          </label>
          <div className="mt-1">
            <input
              type="text"
              id="name"
              {...register("name")}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900"
              placeholder="e.g., Beginner, Intermediate, Advanced"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700"
          >
            Description
          </label>
          <div className="mt-1">
            <textarea
              id="description"
              {...register("description")}
              rows={3}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900"
              placeholder="Describe what students will learn in this level"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">
                {errors.description.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="sortOrder"
            className="block text-sm font-medium text-gray-700"
          >
            Display Order
          </label>
          <div className="mt-1">
            <input
              type="number"
              id="sortOrder"
              {...register("sortOrder", { valueAsNumber: true })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900"
              placeholder="0"
              min="0"
            />
            {errors.sortOrder && (
              <p className="mt-1 text-sm text-red-600">{errors.sortOrder.message}</p>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Used to determine the display order of levels (lower numbers appear first)
          </p>
        </div>

        <div className="flex justify-end space-x-3">
          {editingLevel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? (editingLevel ? "Updating..." : "Creating...") : (editingLevel ? "Update" : "Create")} Level
          </button>
        </div>
      </form>
    </div>
  );
} 