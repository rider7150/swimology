"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const instructorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  phoneNumber: z.string().optional(),
});

type InstructorFormData = z.infer<typeof instructorSchema>;

interface InstructorFormProps {
  organizationId: string;
  editingInstructor?: {
    id: string;
    userId: string;
    phoneNumber: string | null;
    user: {
      name: string;
      email: string;
    };
  } | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function InstructorForm({
  organizationId,
  editingInstructor,
  onSuccess,
  onCancel,
}: InstructorFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<InstructorFormData>({
    resolver: zodResolver(instructorSchema),
    defaultValues: {
      name: editingInstructor?.user.name || "",
      email: editingInstructor?.user.email || "",
      phoneNumber: editingInstructor?.phoneNumber || "",
    },
  });

  const onSubmit = async (data: InstructorFormData) => {
    try {
      setError(null);
      setLoading(true);

      const url = editingInstructor
        ? `/api/organizations/${organizationId}/instructors/${editingInstructor.id}`
        : `/api/organizations/${organizationId}/instructors`;

      const response = await fetch(url, {
        method: editingInstructor ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${editingInstructor ? "update" : "create"} instructor`);
      }

      reset();
      router.refresh();
      onSuccess?.();
      if (editingInstructor) {
        onCancel?.();
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(`Failed to ${editingInstructor ? "update" : "create"} instructor. Please try again.`);
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
          Name
        </label>
        <Input
          id="name"
          {...register("name")}
          className="mt-1"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700"
        >
          Email
        </label>
        <Input
          type="email"
          id="email"
          {...register("email")}
          className="mt-1"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700"
        >
          {editingInstructor ? "New Password (optional)" : "Password"}
        </label>
        <Input
          type="password"
          id="password"
          {...register("password")}
          className="mt-1"
          placeholder={editingInstructor ? "Leave blank to keep current password" : ""}
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">
            {errors.password.message}
          </p>
        )}
        {editingInstructor && (
          <p className="mt-1 text-sm text-gray-500">
            Only enter a new password if you want to change it
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="phoneNumber"
          className="block text-sm font-medium text-gray-700"
        >
          Phone Number
        </label>
        <Input
          type="tel"
          id="phoneNumber"
          {...register("phoneNumber")}
          className="mt-1"
        />
        {errors.phoneNumber && (
          <p className="mt-1 text-sm text-red-600">
            {errors.phoneNumber.message}
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
          {loading ? (editingInstructor ? "Saving..." : "Creating...") : (editingInstructor ? "Save Changes" : "Create Instructor")}
        </Button>
      </div>
    </form>
  );
} 